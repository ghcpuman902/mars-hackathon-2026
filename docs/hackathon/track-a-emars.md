# Discovery: Track A, EMARS-informed weather

Local path: `data/raw/official-packs/extracted/track-a-architecture-emars/track-a-architecture-emars/`

Source pack: [track-a-architecture-emars.zip](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack/blob/main/guided-packs/track-a-architecture-emars.zip)

## What they say it is

Hourly weather for one settlement, shaped like EMARS (Ensemble Mars Atmosphere Reanalysis System). Used to size walls, insulation, or a storm-seal rule for 100 people over 730 sols.

It is **not** a raw EMARS NetCDF extract. Full EMARS is multi-GB. This file is a generator output that uses published Mars climate ranges. Cite Greybush et al., *Geoscience Data Journal*, [doi:10.1002/gdj3.77](https://doi.org/10.1002/gdj3.77).

## Files

| File | Role |
| --- | --- |
| `emars_settlement_hourly_730sol.csv` | 17,520 rows. One row per hour. Use this. |
| `emars_settlement_hourly_730sol.parquet` | Same table. Needs `pyarrow` or `fastparquet`. Neither is in `.venv` yet. |
| `emars_settlement_daily_summary.csv` | 730 rows. Daily min/max/mean. Faster for charts. |
| `manifest.json` | Provenance. Site 18.4°N, 77.5°E. |
| `DATA_NOTES.txt` | Pack readme. |
| `CREDITS_SNIPPET.txt` | Short attribution. |

## Schema (hourly)

`sol`, `hour` (0–23), `mars_year_proxy` (30 or 31), `ls_deg_approx` (0–360), `lat`, `lon`, `temperature_c`, `wind_u_ms`, `wind_v_ms`, `surface_pressure_pa`, `dust_optical_depth`, `dust_storm_flag`, `habitat_thermal_load_kw_100p`.

No nulls. No duplicate sol-hour keys. Lat/lon are constant: **18.4, 77.5**. That is our Jezero pin.

## Numbers we measured

- Temperature: −99.5 °C to −21.0 °C. Mean −56.2 °C. Never the +20 °C equatorial noon the mission brief mentions.
- Pressure: 560–672 Pa. Thin CO2, as advertised.
- Dust optical depth: 0.08–3.67. Storm hours jump this.
- Storm: 1,944 hours, 81 sols (180–260). 11.1% of the series.
- Heating load for 100 people: 15–60 kW. Mean 28.7 kW clear-ish, **42.9 kW in storm**. Always non-negative.
- Mean day-night temperature amplitude is ~57.6 °C on clear sols and ~57.9 °C in storm. The storm barely mutes the swing. Real global dust storms usually do. Do not "prove" storm thermal physics from this.

Daily summary matches the hourly aggregates. `dust_storm_flag` on the daily file is 1 for those 81 sols.

## What ML can honestly do here

Predict `habitat_thermal_load_kw_100p` from hour, Ls, dust, and temperature, then drive a UI rule: seal / thicken / shift occupancy when predicted load crosses a threshold. Or classify storm vs clear from the weather columns as a cheap demo, though the flag is already in the file.

A model that claims it discovered Mars climate from these rows is overclaiming. The decision has to be architectural: given this weather, what do we build?

## Pair with our earlier data

Jezero in `data/raw/sites/candidate-sites.csv` is 18.38°N, 77.58°E. Elevation we sampled from MOLA 16 ppd: about −2,663 m. Ice consistency is slightly negative. This pack is the time series for that pin, not a map.

## Gotchas

- 24 hours per sol, not 24 h 40 m.
- Single point. No spatial grid for CFD or multi-module siting across the crater.
- Heating loads are pessimistic because days stay below −21 °C.
- Penn State listing has no clear open licence badge. Cite EMARS. Do not say we redistributed the official archive.
