"""Physics and sizing models behind the Sol Zero Console numbers.

These are not machine learning. They are the closed-form models that turn the
pack columns into design quantities: solar energy from optical depth, dose
versus regolith cover, thermal skin depth, pressure uplift, wind pressure,
battery mass for a storm bridge. Every constant is named so a judge can
challenge it.

Sources for the priors:
  * Curiosity RAD surface dose ~0.24 mSv/day (Hassler et al. 2014)
  * regolith bulk density 1.6 t/m3, thermal diffusivity 1e-7..6e-7 m2/s
  * Mars gravity 3.71 m/s2, CO2 gas constant 188.9 J/kg/K
  * top-of-atmosphere irradiance at Mars ~590 W/m2
"""
from __future__ import annotations

import numpy as np
import pandas as pd

SOL_S = 88_775.0          # seconds in a sol
MARS_YEAR_SOLS = 668.6
G_MARS = 3.71
R_CO2 = 188.9
RHO_REGOLITH = 1600.0     # kg/m3
S0_MARS = 590.0           # W/m2, top of atmosphere, mean distance
RAD_SURFACE_MSV_PER_DAY = 0.24
ATTEN_LENGTH_M = 0.85     # single-exponential fit to published GCR-in-regolith curves
BUILDUP = 0.15            # secondary-particle buildup term per metre


# ---------------------------------------------------------------- solar
def sky_irradiance_w_m2(tau: np.ndarray, hour: np.ndarray) -> np.ndarray:
    """Beer-Lambert clear-sky model on a flat panel. 24 civil hours per sol
    (the pack's convention). Solar zenith approximated by hour angle only."""
    cosz = np.clip(np.cos((np.asarray(hour) - 12) / 24 * 2 * np.pi), 0, None)
    return S0_MARS * cosz * np.exp(-np.asarray(tau) / np.clip(cosz, 0.1, None))


def daily_solar_kwh_m2(hourly: pd.DataFrame) -> pd.Series:
    ghi = sky_irradiance_w_m2(hourly.dust_optical_depth.values, hourly.hour.values)
    return pd.Series(ghi, index=hourly.index).groupby(hourly.sol).sum() / 1000.0


def pv_area_m2(demand_kw: float, ghi_kwh_m2_sol: float, eff: float = 0.20, derate: float = 0.80) -> float:
    return demand_kw * 24.6 / (ghi_kwh_m2_sol * eff * derate)


# ------------------------------------------------------------- radiation
def dose_msv_per_mars_year(cover_m: float | np.ndarray) -> np.ndarray:
    d = np.asarray(cover_m, dtype=float)
    d0 = RAD_SURFACE_MSV_PER_DAY * MARS_YEAR_SOLS
    return d0 * (1 + BUILDUP * d) * np.exp(-d / ATTEN_LENGTH_M)


# --------------------------------------------------------------- thermal
def skin_depth_m(alpha_m2_s: float, period_s: float = SOL_S) -> float:
    """Depth at which a periodic surface temperature wave falls to 1/e."""
    return float(np.sqrt(2 * alpha_m2_s * period_s / (2 * np.pi)))


def swing_at_depth_c(cover_m: float, diurnal_amp_c: float = 58.0, annual_amp_c: float = 20.0,
                     alpha: float = 3e-7) -> float:
    dd = skin_depth_m(alpha, SOL_S)
    dy = skin_depth_m(alpha, SOL_S * MARS_YEAR_SOLS)
    return diurnal_amp_c * np.exp(-cover_m / dd) + annual_amp_c * np.exp(-cover_m / dy)


# ------------------------------------------------------------ structural
def overburden_kpa(cover_m: float) -> float:
    return RHO_REGOLITH * G_MARS * cover_m / 1000.0


def net_uplift_kpa(cover_m: float, cabin_kpa: float = 70.0) -> float:
    return cabin_kpa - overburden_kpa(cover_m)


def wind_dynamic_pressure_pa(pressure_pa, temp_c, wind_ms) -> np.ndarray:
    rho = np.asarray(pressure_pa) / (R_CO2 * (np.asarray(temp_c) + 273.15))
    return 0.5 * rho * np.asarray(wind_ms) ** 2


def wind_rose(u: np.ndarray, v: np.ndarray, threshold_ms: float | None = None):
    """Hours per 45-degree sector, by direction the wind blows TOWARD
    (u east, v north). Returns list of 8 counts N, NE, E, SE, S, SW, W, NW."""
    ws = np.hypot(u, v)
    ang = np.degrees(np.arctan2(u, v)) % 360
    sect = (ang // 45).astype(int)
    if threshold_ms is not None:
        sect = sect[ws > threshold_ms]
    return [int((sect == i).sum()) for i in range(8)]


# ---------------------------------------------------------------- energy
def storm_bridge(demand_kw: float, storm_sols: int = 81, wh_per_kg: float = 150.0) -> dict:
    mwh = demand_kw * 24.6 * storm_sols / 1000.0
    return {"energy_mwh": mwh, "battery_mass_t": mwh * 1e6 / wh_per_kg / 1000.0}


def demand_budget_kw(heating_kw: float, crew: int = 100, crop_m2: float = 3500.0,
                     led_w_m2: float = 250.0) -> dict:
    """Rough electrical budget. Greenhouse lighting is the term that dominates
    whenever the farm is underground under LEDs."""
    d = {
        "heating": heating_kw,
        "eclss": 0.5 * crew,          # kW, ISS-scale life support per person
        "isru_water_o2": 50.0,
        "greenhouse_led": crop_m2 * led_w_m2 / 1000.0,
        "industry_misc": 100.0,
    }
    d["total"] = sum(d.values())
    return d
