"""Build small demo layers from the downloaded rasters."""

from __future__ import annotations

import json

import numpy as np
import pandas as pd
from PIL import Image

from mars_data import (
    CRATERS,
    MOLA_4PPD,
    MOLA_16PPD,
    PROCESSED,
    ROOT,
    SWIM_0_1,
    SWIM_1_5,
    SWIM_5,
    crater_count_near,
    load_craters,
    load_mola,
    load_sites,
    mola_sample,
    mola_slope_deg,
    swim_sample,
)

PUBLIC_DATA = ROOT / "public" / "data"


def elevation_png(elev: np.ndarray, dest) -> None:
    finite = elev[np.isfinite(elev)]
    lo, hi = np.percentile(finite, [1, 99])
    norm = np.clip((elev - lo) / (hi - lo), 0, 1)
    img = (norm * 255).astype(np.uint8)
    Image.fromarray(img, mode="L").save(dest)


def hillshade_png(elev: np.ndarray, dest) -> None:
    dy, dx = np.gradient(elev.astype(np.float64))
    slope = np.pi / 2 - np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(-dx, dy)
    azimuth = np.radians(315)
    altitude = np.radians(45)
    shaded = np.sin(altitude) * np.sin(slope) + np.cos(altitude) * np.cos(slope) * np.cos(
        azimuth - aspect
    )
    shaded = np.clip(shaded, 0, 1)
    Image.fromarray((shaded * 255).astype(np.uint8), mode="L").save(dest)


def handle_main() -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)

    elev4 = load_mola(MOLA_4PPD)
    elev16 = load_mola(MOLA_16PPD)
    elevation_png(elev4, PROCESSED / "mola_4ppd_elevation.png")
    hillshade_png(elev4, PROCESSED / "mola_4ppd_hillshade.png")
    elevation_png(elev4, PUBLIC_DATA / "mola_4ppd_elevation.png")
    hillshade_png(elev4, PUBLIC_DATA / "mola_4ppd_hillshade.png")

    sites = load_sites()
    craters = load_craters(min_diam_km=5.0) if CRATERS.exists() else None
    rows = []
    for site in sites.itertuples(index=False):
        lat = float(site.lat_deg)
        lon = float(site.lon_east_deg)
        row = {
            "id": site.id,
            "name": site.name,
            "lat_deg": lat,
            "lon_east_deg": lon,
            "archetype": site.archetype,
            "why_it_matters": site.why_it_matters,
            "tracks": site.tracks,
            "elevation_m": round(mola_sample(elev16, lat, lon), 1),
            "slope_deg_local": round(mola_slope_deg(elev16, lat, lon), 2),
            "ice_0_1m": swim_sample(SWIM_0_1, lat, lon),
            "ice_1_5m": swim_sample(SWIM_1_5, lat, lon),
            "ice_gt_5m": swim_sample(SWIM_5, lat, lon),
            "craters_5km_within_50km": (
                crater_count_near(craters, lat, lon, 50.0) if craters is not None else None
            ),
        }
        for key in ("ice_0_1m", "ice_1_5m", "ice_gt_5m"):
            val = row[key]
            row[key] = None if val != val else round(float(val), 4)
        rows.append(row)

    scored = PROCESSED / "sites_scored.csv"
    json_path = PROCESSED / "sites_scored.json"
    public_json = PUBLIC_DATA / "sites_scored.json"
    df = pd.DataFrame(rows)
    df.to_csv(scored, index=False)
    payload = {"sites": rows, "notes": "Ice scores are SWIM consistency, roughly -1 to +1."}
    json_path.write_text(json.dumps(payload, indent=2))
    public_json.write_text(json.dumps(payload, indent=2))
    print(f"wrote {scored}")
    print(df[["id", "elevation_m", "ice_0_1m", "ice_1_5m", "craters_5km_within_50km"]].to_string(index=False))


if __name__ == "__main__":
    handle_main()
