"""Descriptive analysis of the three guided packs.

This script produced every headline number in the Sol Zero Console
(public/sol-zero-console) and the decision timeline. It is pandas plus the
physics in physics.py, not ML. Output: data/processed/settlement_summary.json
and a printed decision table.

Run:  python ml/settlement/analyse_packs.py
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

import physics as P
from paths import PROCESSED, TRACK_A, TRACK_B, TRACK_B2, TRACK_C, ensure_out, pack


def track_a() -> dict:
    a = pd.read_csv(pack(TRACK_A) / "emars_settlement_hourly_730sol.csv")
    a["ws"] = np.hypot(a.wind_u_ms, a.wind_v_ms)
    a["q_pa"] = P.wind_dynamic_pressure_pa(a.surface_pressure_pa, a.temperature_c, a.ws)
    storm, clear = a[a.dust_storm_flag == 1], a[a.dust_storm_flag == 0]
    daily = a.groupby("sol").agg(tmin=("temperature_c", "min"), tmax=("temperature_c", "max"),
                                 tau=("dust_optical_depth", "max"), storm=("dust_storm_flag", "max"))
    solar = P.daily_solar_kwh_m2(a)
    rose_all = P.wind_rose(a.wind_u_ms.values, a.wind_v_ms.values)
    rose_strong = P.wind_rose(a.wind_u_ms.values, a.wind_v_ms.values, 15.0)
    return {
        "site": {"lat": float(a.lat.iloc[0]), "lon": float(a.lon.iloc[0])},
        "temperature_c": {"mean": a.temperature_c.mean(), "min": a.temperature_c.min(), "max": a.temperature_c.max(),
                          "clear_mean": clear.temperature_c.mean(), "storm_mean": storm.temperature_c.mean(),
                          "diurnal_swing_clear": (daily.tmax - daily.tmin)[daily.storm == 0].mean(),
                          "diurnal_swing_storm": (daily.tmax - daily.tmin)[daily.storm == 1].mean()},
        "wind_ms": {"mean_clear": clear.ws.mean(), "mean_storm": storm.ws.mean(), "max": a.ws.max(),
                    "hours_over_20": int((a.ws > 20).sum()),
                    "share_strong_toward_NE": rose_strong[1] / max(1, sum(rose_strong))},
        "wind_dynamic_pressure_pa": {"max": a.q_pa.max(), "earth_equivalent_at_25ms": 0.5 * 1.225 * 25 ** 2},
        "dust_optical_depth": {"clear_mean": clear.dust_optical_depth.mean(), "storm_mean": storm.dust_optical_depth.mean(),
                               "max": a.dust_optical_depth.max(), "sol179": daily.tau.loc[179], "sol180": daily.tau.loc[180]},
        "solar_kwh_m2_sol": {"clear_mean": solar[daily.storm == 0].mean(), "storm_mean": solar[daily.storm == 1].mean(),
                             "storm_min": solar[daily.storm == 1].min()},
        "heating_kw_100p": {"mean": a.habitat_thermal_load_kw_100p.mean(), "clear_mean": clear.habitat_thermal_load_kw_100p.mean(),
                            "storm_mean": storm.habitat_thermal_load_kw_100p.mean(), "peak": a.habitat_thermal_load_kw_100p.max(),
                            "total_mwh_730sol": a.habitat_thermal_load_kw_100p.sum() / 1000},
        "wind_rose_hours": {"all": rose_all, "over_15ms": rose_strong},
    }


def track_c() -> dict:
    c = pd.read_csv(pack(TRACK_C) / "mars500_eclss_scaled_100p_730d.csv")
    g = c.groupby("dust_storm_flag").mean(numeric_only=True)
    return {
        "per_day_mean": {k: c[k].mean() for k in ["o2_consumption_kg", "water_use_kg", "food_kg", "net_o2_makeup_kg",
                                                  "net_water_makeup_kg", "o2_recovery_efficiency", "water_recovery_efficiency"]},
        "totals_730d_t": {k: c[k].sum() / 1000 for k in ["o2_consumption_kg", "water_use_kg", "food_kg", "net_o2_makeup_kg", "net_water_makeup_kg"]},
        "storm_vs_clear": {k: {"clear": g.loc[0, k], "storm": g.loc[1, k]} for k in
                           ["solar_availability", "net_water_makeup_kg", "net_o2_makeup_kg", "greenhouse_ventilation_m3_per_h", "cabin_co2_ppm_proxy"]},
        "water_for_makeup_and_electrolysis_kg_day": c.net_water_makeup_kg.mean() + c.net_o2_makeup_kg.mean() * 18 / 16,
    }


def track_b() -> dict:
    b = pd.read_csv(pack(TRACK_B) / "logistics_duty_cycle_100p_730sol.csv")
    t = pd.read_csv(pack(TRACK_B2) / "terrain_grid.csv")
    r = pd.read_csv(pack(TRACK_B2) / "routes.csv")
    v = pd.read_csv(pack(TRACK_B2) / "vehicles.csv").set_index("vehicle_type")
    tt = t.groupby("terrain_type")[["traversal_energy_wh_per_m", "hazard_prob", "slope_deg"]].mean()
    return {
        "trips": {"n": len(b), "per_sol": len(b) / 730, "kwh_per_sol": b.energy_kwh.sum() / 730,
                  "risk_clear": b[b.dust_storm_flag == 0].terrain_risk_score.mean(),
                  "risk_storm": b[b.dust_storm_flag == 1].terrain_risk_score.mean(), "battery_soh_end": b.battery_soh.min()},
        "terrain_by_type": tt.round(3).to_dict(orient="index"),
        "route_success_by_vehicle_and_type": r.groupby(["vehicle_type", "route_type"]).mission_success.mean().round(3).to_dict(),
        "swarm_builder": v.loc["swarm_builder"].to_dict(),
    }


def derived(a: dict) -> dict:
    heat = a["heating_kw_100p"]["mean"]
    budget = P.demand_budget_kw(heat)
    bridge = P.storm_bridge(budget["total"])
    depth = {f"{d:.1f}": {"dose_msv_yr": float(P.dose_msv_per_mars_year(d)), "swing_c": float(P.swing_at_depth_c(d)),
                          "overburden_kpa": P.overburden_kpa(d), "net_uplift_kpa": P.net_uplift_kpa(d)} for d in (0, 0.5, 1, 2, 3, 4, 5, 10)}
    return {
        "demand_budget_kw": budget,
        "storm_bridge_on_batteries": bridge,
        "pv_area_m2_clear": P.pv_area_m2(budget["total"], a["solar_kwh_m2_sol"]["clear_mean"]),
        "skin_depth_m": {"diurnal_alpha3e-7": P.skin_depth_m(3e-7), "annual_alpha3e-7": P.skin_depth_m(3e-7, P.SOL_S * P.MARS_YEAR_SOLS)},
        "depth_table": depth,
        "volume": {"pressurised_m3_100p": [5000, 10000], "crop_area_m2_led_budget": 3500, "crop_area_m2_full_loop": 4500},
    }


def _clean(o):
    if isinstance(o, dict):
        return {str(k): _clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return round(float(o), 4)
    if isinstance(o, (np.integer,)):
        return int(o)
    return o


def main() -> None:
    ensure_out()
    out = {"track_a": track_a(), "track_c": track_c(), "track_b": track_b()}
    out["derived"] = derived(out["track_a"])
    out = _clean(out)
    (PROCESSED / "settlement_summary.json").write_text(json.dumps(out, indent=2))
    A, C, B, D = out["track_a"], out["track_c"], out["track_b"], out["derived"]
    rows = [
        ("Site", f"solar {A['solar_kwh_m2_sol']['clear_mean']} kWh/m2/sol clear, mean {A['temperature_c']['clear_mean']} C; makeup water {C['water_for_makeup_and_electrolysis_kg_day']} kg/day"),
        ("Power", f"storm solar {A['solar_kwh_m2_sol']['storm_mean']} kWh/m2/sol; battery bridge {D['storm_bridge_on_batteries']['energy_mwh']} MWh = {D['storm_bridge_on_batteries']['battery_mass_t']} t"),
        ("Where to dig", f"plain {B['terrain_by_type']['regolith_plain']['traversal_energy_wh_per_m']} vs rock {B['terrain_by_type']['rock_field']['traversal_energy_wh_per_m']} Wh/m"),
        ("Depth", f"dose 3 m {D['depth_table']['3.0']['dose_msv_yr']} mSv/yr; uplift {D['depth_table']['3.0']['net_uplift_kpa']} kPa"),
        ("Exits", f"{A['wind_ms']['share_strong_toward_NE']*100:.0f}% of >15 m/s winds toward NE; q max {A['wind_dynamic_pressure_pa']['max']} Pa"),
        ("Storm rule", f"tau sol179 {A['dust_optical_depth']['sol179']} -> sol180 {A['dust_optical_depth']['sol180']}; heat storm {A['heating_kw_100p']['storm_mean']} kW"),
        ("Life support", f"O2 {C['per_day_mean']['o2_consumption_kg']} kg/d, water {C['per_day_mean']['water_use_kg']} kg/d, food {C['totals_730d_t']['food_kg']} t/730d"),
        ("Daylight", f"greenhouse LED {D['demand_budget_kw']['greenhouse_led']} kW of {D['demand_budget_kw']['total']} kW total"),
        ("Crewed storm", f"CO2 {C['storm_vs_clear']['cabin_co2_ppm_proxy']['clear']} -> {C['storm_vs_clear']['cabin_co2_ppm_proxy']['storm']} ppm; water makeup {C['storm_vs_clear']['net_water_makeup_kg']['storm']} kg/d"),
    ]
    print(f"{'decision':14s} numbers")
    for k, v in rows:
        print(f"{k:14s} {v}")
    print("\nwrote", PROCESSED / "settlement_summary.json")


if __name__ == "__main__":
    main()
