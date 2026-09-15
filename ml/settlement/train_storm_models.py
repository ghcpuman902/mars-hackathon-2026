"""ML decision 2: the storm rule and the heating plant, learned from Packs A and C.

  1. Storm-mode detector  (Pack A, hourly). Predict dust_storm_flag from the
     sensors a buried habitat actually has: temperature, wind, pressure, hour.
     Dust optical depth is deliberately EXCLUDED, because the flag is derived
     from it and the score would be trivial. Grouped by sol so no hour of a
     test sol leaks into training.
  2. Heating-load regressor (Pack A, hourly). Predict habitat_thermal_load
     from weather so the reactor's thermal side can be sized and scheduled.
  3. Cabin-air regressor (Pack C, daily). Predict cabin_co2_ppm_proxy from
     activity, solar availability, storm flag, ventilation.
  4. Next-day water-makeup forecast (Pack C). Lagged features, time-ordered
     split, so the loop can order ice a day ahead.

Both packs are simulated, so high scores mean the generator's rules were
recovered. The storm detector is the one with real design content: it tells
you whether a thermal/wind trip can replace an optical sensor.

Run:  python ml/settlement/train_storm_models.py
"""
from __future__ import annotations

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.metrics import average_precision_score, mean_absolute_error, r2_score, roc_auc_score
from sklearn.model_selection import GroupKFold, KFold, cross_val_predict

from paths import PROCESSED, TRACK_A, TRACK_C, ensure_out, pack


def storm_detector(a: pd.DataFrame) -> tuple[dict, HistGradientBoostingClassifier]:
    feats = ["temperature_c", "ws", "surface_pressure_pa", "hour", "t_anom", "ws_roll6"]
    clf = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05, random_state=0)
    proba = cross_val_predict(clf, a[feats], a.dust_storm_flag, cv=GroupKFold(5), groups=a.sol, method="predict_proba")[:, 1]
    # design question: how many sols of lag before the detector trips at 0.5?
    a2 = a.assign(p=proba)
    daily = a2.groupby("sol").p.mean()
    trip_sol = int(daily[(daily.index >= 170) & (daily > 0.5)].index.min())
    m = {"roc_auc": roc_auc_score(a.dust_storm_flag, proba), "avg_precision": average_precision_score(a.dust_storm_flag, proba),
         "features": feats, "first_sol_detector_trips": trip_sol, "true_storm_onset_sol": 180,
         "detection_lag_sols": trip_sol - 180}
    clf.fit(a[feats], a.dust_storm_flag)
    print(f"{'storm detector (no dust input)':34s} AUC {m['roc_auc']:.3f}  AP {m['avg_precision']:.3f}  trips sol {trip_sol} (onset 180)")
    return m, clf


def heating_model(a: pd.DataFrame) -> tuple[dict, HistGradientBoostingRegressor]:
    feats = ["temperature_c", "ws", "dust_optical_depth", "hour", "surface_pressure_pa"]
    reg = HistGradientBoostingRegressor(max_iter=300, learning_rate=0.05, random_state=0)
    pred = cross_val_predict(reg, a[feats], a.habitat_thermal_load_kw_100p, cv=GroupKFold(5), groups=a.sol)
    reg.fit(a[feats], a.habitat_thermal_load_kw_100p)
    # what-if: the storm season at the annual-mean regolith temperature instead of surface air
    storm = a[a.dust_storm_flag == 1]
    m = {"r2": r2_score(a.habitat_thermal_load_kw_100p, pred), "mae_kw": mean_absolute_error(a.habitat_thermal_load_kw_100p, pred),
         "predicted_peak_kw": float(np.max(pred)), "predicted_storm_mean_kw": float(pred[a.dust_storm_flag.values == 1].mean()),
         "features": feats}
    print(f"{'heating load kW':34s} R2 {m['r2']:.3f}  MAE {m['mae_kw']:.2f} kW  storm mean {m['predicted_storm_mean_kw']:.1f} kW")
    return m, reg


def cabin_air_model(c: pd.DataFrame) -> dict:
    feats = ["activity_level", "solar_availability", "dust_storm_flag", "greenhouse_ventilation_m3_per_h", "o2_recovery_efficiency"]
    reg = HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, random_state=0)
    pred = cross_val_predict(reg, c[feats], c.cabin_co2_ppm_proxy, cv=KFold(5, shuffle=True, random_state=0))
    m = {"r2": r2_score(c.cabin_co2_ppm_proxy, pred), "mae_ppm": mean_absolute_error(c.cabin_co2_ppm_proxy, pred), "features": feats,
         "note": "proxy tops out ~1200 ppm in-pack; mild stress only, per KNOWN_ISSUES"}
    print(f"{'cabin CO2 ppm':34s} R2 {m['r2']:.3f}  MAE {m['mae_ppm']:.0f} ppm")
    return m


def water_forecast(c: pd.DataFrame) -> dict:
    d = c.copy()
    for lag in (1, 2, 3):
        d[f"wmake_lag{lag}"] = d.net_water_makeup_kg.shift(lag)
        d[f"storm_lag{lag}"] = d.dust_storm_flag.shift(lag)
    d["target"] = d.net_water_makeup_kg.shift(-1)
    d = d.dropna()
    feats = [f"wmake_lag{l}" for l in (1, 2, 3)] + [f"storm_lag{l}" for l in (1, 2, 3)] + ["activity_level", "solar_availability"]
    split = int(len(d) * 0.7)          # time-ordered: train on the first 70 %, test on the rest
    tr, te = d.iloc[:split], d.iloc[split:]
    reg = HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, random_state=0).fit(tr[feats], tr.target)
    pred = reg.predict(te[feats])
    persist = te.wmake_lag1.values
    m = {"mae_kg_model": mean_absolute_error(te.target, pred), "mae_kg_persistence": mean_absolute_error(te.target, persist),
         "test_days": int(len(te)), "features": feats}
    print(f"{'water makeup next-day':34s} MAE {m['mae_kg_model']:.2f} kg vs persistence {m['mae_kg_persistence']:.2f} kg")
    return m


def main() -> None:
    ensure_out()
    a = pd.read_csv(pack(TRACK_A) / "emars_settlement_hourly_730sol.csv")
    a["ws"] = np.hypot(a.wind_u_ms, a.wind_v_ms)
    a["t_anom"] = a.temperature_c - a.groupby("hour").temperature_c.transform("mean")
    a["ws_roll6"] = a.ws.rolling(6, min_periods=1).mean()
    c = pd.read_csv(pack(TRACK_C) / "mars500_eclss_scaled_100p_730d.csv")

    m_storm, clf = storm_detector(a)
    m_heat, reg = heating_model(a)
    m_air = cabin_air_model(c)
    m_water = water_forecast(c)

    joblib.dump({"storm_detector": clf, "heating": reg}, PROCESSED / "storm_models.joblib")
    mp = PROCESSED / "settlement_ml_metrics.json"
    allm = json.loads(mp.read_text()) if mp.exists() else {}
    allm["storm"] = {"detector": m_storm, "heating": m_heat, "cabin_air": m_air, "water_forecast": m_water}
    mp.write_text(json.dumps(allm, indent=2, default=float))
    print("wrote", mp)


if __name__ == "__main__":
    main()
