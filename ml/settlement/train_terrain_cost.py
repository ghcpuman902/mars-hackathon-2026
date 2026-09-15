"""ML decision 1: where the builders dig, and which way the haulers drive.

Two learned models on the Track B2 mobility pack, then a route planner that
uses the learned cost surface.

  1. Cell cost regressor   terrain features -> Wh per metre   (LightGBM)
  2. Cell hazard regressor terrain features -> stall probability
  3. Mission success classifier on routes.csv (vehicle + route stats -> 0/1)
  4. Dijkstra over the PREDICTED cost surface, compared with the naive
     straight line, for the swarm builder's 1.2 kWh pack.

Metrics are 5-fold cross-validated. The grid is synthetic, so treat scores as
"the model recovers the generator's rules", not as terrain intelligence.

Run:  python ml/settlement/train_terrain_cost.py
Outputs: data/processed/terrain_cost_model.joblib, route_success_model.joblib,
         settlement_ml_metrics.json (merged), planned_route.json
"""
from __future__ import annotations

import heapq
import json

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import mean_absolute_error, r2_score, roc_auc_score
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_predict

from paths import PROCESSED, TRACK_B2, ensure_out, pack

CELL_M = 20.0
FEATS = ["slope_deg", "rock_density", "dust_depth_cm", "elevation_m", "solar_exposure_pct", "terrain_type"]


def load_grid() -> pd.DataFrame:
    t = pd.read_csv(pack(TRACK_B2) / "terrain_grid.csv")
    t["terrain_type"] = t.terrain_type.astype("category")
    return t.sort_values(["grid_y", "grid_x"]).reset_index(drop=True)


def cv_regress(X, y, name: str) -> tuple[lgb.LGBMRegressor, dict]:
    model = lgb.LGBMRegressor(n_estimators=400, learning_rate=0.05, num_leaves=15, verbose=-1)
    pred = cross_val_predict(model, X, y, cv=KFold(5, shuffle=True, random_state=0))
    m = {"r2": r2_score(y, pred), "mae": mean_absolute_error(y, pred)}
    model.fit(X, y)
    imp = dict(zip(X.columns, model.feature_importances_.tolist()))
    m["top_features"] = sorted(imp, key=imp.get, reverse=True)[:3]
    print(f"{name:28s} R2 {m['r2']:.3f}  MAE {m['mae']:.3f}  drivers {m['top_features']}")
    return model, m


def dijkstra(cost: np.ndarray, hazard: np.ndarray, n: int, start: int, goal: int, hazard_weight: float = 10.0):
    """Cost per step = distance * (Wh/m + hazard_weight * p_stall). Returns path, Wh."""
    dist = np.full(n * n, np.inf)
    prev = np.full(n * n, -1, dtype=int)
    dist[start] = 0.0
    pq = [(0.0, start)]
    steps = [(1, 0, CELL_M), (-1, 0, CELL_M), (0, 1, CELL_M), (0, -1, CELL_M),
             (1, 1, CELL_M * 2 ** 0.5), (-1, -1, CELL_M * 2 ** 0.5), (1, -1, CELL_M * 2 ** 0.5), (-1, 1, CELL_M * 2 ** 0.5)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == goal:
            break
        if d > dist[u]:
            continue
        ux, uy = u % n, u // n
        for dx, dy, L in steps:
            vx, vy = ux + dx, uy + dy
            if 0 <= vx < n and 0 <= vy < n:
                v = vy * n + vx
                nd = d + L * (cost[v] + hazard_weight * hazard[v])
                if nd < dist[v]:
                    dist[v], prev[v] = nd, u
                    heapq.heappush(pq, (nd, v))
    path = []
    v = goal
    while v >= 0:
        path.append(int(v))
        v = prev[v]
    path.reverse()
    wh = sum(CELL_M * (2 ** 0.5 if abs(path[i] % n - path[i - 1] % n) + abs(path[i] // n - path[i - 1] // n) == 2 else 1) * cost[path[i]]
             for i in range(1, len(path)))
    return path, wh


def naive_line(cost: np.ndarray, n: int, start: int, goal: int):
    sx, sy, gx, gy = start % n, start // n, goal % n, goal // n
    k = max(abs(gx - sx), abs(gy - sy))
    cells = [int(round(sy + (gy - sy) * i / k)) * n + int(round(sx + (gx - sx) * i / k)) for i in range(k + 1)]
    wh = sum(CELL_M * (2 ** 0.5 if abs(cells[i] % n - cells[i - 1] % n) + abs(cells[i] // n - cells[i - 1] // n) == 2 else 1) * cost[cells[i]]
             for i in range(1, len(cells)))
    return cells, wh


def main() -> None:
    ensure_out()
    t = load_grid()
    X = t[FEATS]
    cost_model, m_cost = cv_regress(X, t.traversal_energy_wh_per_m, "cell energy Wh/m")
    haz_model, m_haz = cv_regress(X, t.hazard_prob, "cell hazard p(stall)")

    # ---- route success classifier
    r = pd.read_csv(pack(TRACK_B2) / "routes.csv")
    v = pd.read_csv(pack(TRACK_B2) / "vehicles.csv")
    r = r.merge(v[["vehicle_type", "mass_kg", "base_efficiency_mult"]], on="vehicle_type")
    rf = ["distance_km", "avg_slope_deg", "max_slope_deg", "avg_rock_density", "pct_high_hazard_cells",
          "payload_fraction_of_max", "battery_capacity_wh", "mass_kg", "base_efficiency_mult"]
    clf = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05, random_state=0)
    proba = cross_val_predict(clf, r[rf], r.mission_success, cv=StratifiedKFold(5, shuffle=True, random_state=0), method="predict_proba")[:, 1]
    m_route = {"roc_auc": roc_auc_score(r.mission_success, proba), "base_rate": r.mission_success.mean(),
               "success_by_vehicle": r.groupby("vehicle_type").mission_success.mean().round(3).to_dict()}
    clf.fit(r[rf], r.mission_success)
    print(f"{'route success (AUC)':28s} {m_route['roc_auc']:.3f}   base rate {m_route['base_rate']:.2f}")

    # ---- plan on the predicted surface
    n = int(t.grid_x.max()) + 1
    cost_pred = cost_model.predict(X)
    haz_pred = haz_model.predict(X)
    start, goal = 4 * n + 4, 55 * n + 54
    path, wh_opt = dijkstra(cost_pred, haz_pred, n, start, goal)
    line, wh_naive = naive_line(cost_pred, n, start, goal)
    swarm_wh = float(v.set_index("vehicle_type").loc["swarm_builder", "battery_capacity_wh"])
    plan = {"start": start, "goal": goal, "planned_cells": path, "naive_cells": line,
            "planned_wh": wh_opt, "naive_wh": wh_naive, "swarm_builder_pack_wh": swarm_wh,
            "planned_fits_one_charge": bool(wh_opt < swarm_wh), "naive_fits_one_charge": bool(wh_naive < swarm_wh),
            "plain_vs_rock_wh_per_m": t.groupby("terrain_type", observed=True).traversal_energy_wh_per_m.mean().round(2).to_dict()}
    print(f"planned route {wh_opt:.0f} Wh vs naive {wh_naive:.0f} Wh (swarm pack {swarm_wh:.0f} Wh)")

    joblib.dump({"cost": cost_model, "hazard": haz_model, "features": FEATS}, PROCESSED / "terrain_cost_model.joblib")
    joblib.dump({"model": clf, "features": rf}, PROCESSED / "route_success_model.joblib")
    (PROCESSED / "planned_route.json").write_text(json.dumps(plan))
    mp = PROCESSED / "settlement_ml_metrics.json"
    allm = json.loads(mp.read_text()) if mp.exists() else {}
    allm["terrain"] = {"cell_energy": m_cost, "cell_hazard": m_haz, "route_success": m_route,
                       "route_plan_wh": {"planned": wh_opt, "naive": wh_naive}}
    mp.write_text(json.dumps(allm, indent=2, default=float))
    print("wrote", mp)


if __name__ == "__main__":
    main()
