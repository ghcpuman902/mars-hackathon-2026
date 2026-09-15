"""Load the local Mars rasters and tables downloaded for tonight's hack."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import rasterio

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"

MOLA_4PPD = RAW / "mola" / "megt90n000cb.img"
MOLA_16PPD = RAW / "mola" / "megt90n000eb.img"
SWIM_0_1 = RAW / "swim" / "SWIM4MIM_Ci_0_1.tif"
SWIM_1_5 = RAW / "swim" / "SWIM4MIM_Ci_1_5.tif"
SWIM_5 = RAW / "swim" / "SWIM4MIM_Ci_5.tif"
WEATHER = RAW / "weather" / "curiosity-rems-daily.csv"
CRATERS = RAW / "craters" / "Catalog_Mars_Release_2020_1kmPlus_FullMorphData.csv"
SITES = RAW / "sites" / "candidate-sites.csv"

# SWIM is Mars 2000 equirectangular, clon 0, metres, roughly ±60° lat.
_SWIM_X_AT_180 = 10_669_445.8675
_SWIM_M_PER_DEG = _SWIM_X_AT_180 / 180.0
_MARS_RADIUS_M = 3_396_190.0


def lon_to_east(lon: float) -> float:
    """Normalise longitude to [0, 360) east."""
    return float(lon) % 360.0


def lon_to_180(lon: float) -> float:
    """Normalise longitude to (-180, 180]."""
    return ((float(lon) + 180.0) % 360.0) - 180.0


def load_mola(path: Path = MOLA_16PPD) -> np.ndarray:
    """Read a MEGDR topography IMG. Values are metres, big-endian int16."""
    if path.name.endswith("cb.img"):
        shape = (720, 1440)
    elif path.name.endswith("eb.img"):
        shape = (2880, 5760)
    else:
        raise ValueError(f"Unknown MEGDR layout for {path.name}")
    expected = shape[0] * shape[1] * 2
    raw = path.read_bytes()
    if len(raw) != expected:
        raise ValueError(f"{path} is {len(raw)} bytes, expected {expected}")
    return np.frombuffer(raw, dtype=">i2").reshape(shape).astype(np.float32)


def mola_sample(elev: np.ndarray, lat: float, lon: float) -> float:
    """Nearest-neighbour elevation in metres. lon is east [0, 360) or ±180."""
    lon_e = lon_to_east(lon)
    rows, cols = elev.shape
    col = int(round(lon_e / 360.0 * cols)) % cols
    row = int(round((90.0 - lat) / 180.0 * rows))
    row = min(max(row, 0), rows - 1)
    return float(elev[row, col])


def mola_slope_deg(elev: np.ndarray, lat: float, lon: float) -> float:
    """Rough local slope from the 3x3 neighbourhood, degrees."""
    lon_e = lon_to_east(lon)
    rows, cols = elev.shape
    col = int(round(lon_e / 360.0 * cols)) % cols
    row = int(round((90.0 - lat) / 180.0 * rows))
    row = min(max(row, 0), rows - 1)
    window = elev[
        max(row - 1, 0) : min(row + 2, rows),
        max(col - 1, 0) : min(col + 2, cols),
    ]
    if window.size < 4:
        return float("nan")
    metres_per_px = 2 * np.pi * _MARS_RADIUS_M / cols
    dz = float(window.max() - window.min())
    run = metres_per_px * max(window.shape)
    if run <= 0:
        return float("nan")
    return float(np.degrees(np.arctan(dz / run)))


def _swim_xy(lat: float, lon: float) -> tuple[float, float]:
    return lon_to_180(lon) * _SWIM_M_PER_DEG, lat * _SWIM_M_PER_DEG


def swim_sample(path: Path, lat: float, lon: float) -> float:
    """Ice-consistency score. Nodata and out-of-bounds become NaN."""
    if abs(lat) > 60.5:
        return float("nan")
    x, y = _swim_xy(lat, lon)
    with rasterio.open(path) as src:
        val = float(list(src.sample([(x, y)]))[0][0])
        if src.nodata is not None and val == src.nodata:
            return float("nan")
        if val < -10:
            return float("nan")
        return val


def load_weather() -> pd.DataFrame:
    return pd.read_csv(WEATHER)


def load_sites() -> pd.DataFrame:
    return pd.read_csv(SITES)


def load_craters(min_diam_km: float = 5.0) -> pd.DataFrame:
    """Robbins 2020, filtered. Full file is ~385k rows / 93 MB."""
    cols = ["CRATER_ID", "LAT_CIRC_IMG", "LON_CIRC_IMG", "DIAM_CIRC_IMG"]
    df = pd.read_csv(CRATERS, usecols=cols)
    return df.loc[df["DIAM_CIRC_IMG"] >= min_diam_km].copy()


def crater_count_near(
    craters: pd.DataFrame, lat: float, lon: float, radius_km: float = 50.0
) -> int:
    """Count craters within a crude degree window, then a haversine cut."""
    lon_e = lon_to_east(lon)
    deg = radius_km / 59.5  # ~1° ≈ 59.5 km at equator
    lat_ok = (craters["LAT_CIRC_IMG"] - lat).abs() <= deg
    dlon = (craters["LON_CIRC_IMG"] - lon_e + 180.0) % 360.0 - 180.0
    near = craters.loc[lat_ok & (dlon.abs() <= deg / max(np.cos(np.radians(lat)), 0.2))]
    if near.empty:
        return 0
    lat1 = np.radians(lat)
    lat2 = np.radians(near["LAT_CIRC_IMG"].to_numpy())
    dlat = lat2 - lat1
    dlon_r = np.radians(
        (near["LON_CIRC_IMG"].to_numpy() - lon_e + 180.0) % 360.0 - 180.0
    )
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon_r / 2) ** 2
    dist_km = 2 * _MARS_RADIUS_M / 1000.0 * np.arcsin(np.sqrt(a))
    return int((dist_km <= radius_km).sum())
