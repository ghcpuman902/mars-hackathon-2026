# Discovery: Track C, simulated ECLSS log

Local path: `data/raw/official-packs/extracted/track-c-life-support-hre/track-c-life-support-hre/`

Source pack: [track-c-life-support-hre.zip](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack/blob/main/guided-packs/track-c-life-support-hre.zip)

## What they say it is

A daily closed-loop life-support log for 100 people across 730 days, framed by ESA HREDA / Mars500 and NASA metabolic rates.

It is **not** Mars500 telemetry. HREDA is login-gated. The table is built from published per-person rates, then scaled. Cannot support medical or life-safety claims. Cite ESA HREDA for framing and NASA NTRS 20170007268 / Weiland 1994 for the rates.

ESA archive data is often CC BY-NC. This pack does not redistribute ESA files.

## Files

| File | Role |
| --- | --- |
| `mars500_eclss_scaled_100p_730d.csv` | 730 daily rows. Use this. |
| `window_totals.json` | Run totals. Matches the CSV sums. |
| `manifest.json` | Rate priors and storm window. |
| `load_example.py` | Four print statements. Column names match the CSV. |
| `DATA_NOTES.txt` | Pack readme. |

## Schema

`day`, `sol` (same 0–729), `crew_size` (always 100), `activity_level`, `dust_storm_flag`, `solar_availability`, `o2_consumption_kg`, `co2_production_kg`, `water_use_kg`, `food_kg`, `waste_kg`, `o2_recovery_efficiency`, `water_recovery_efficiency`, `net_o2_makeup_kg`, `net_water_makeup_kg`, `greenhouse_ventilation_m3_per_h`, `cabin_co2_ppm_proxy`.

No nulls.

Manifest priors per person-day: O2 0.84 kg, CO2 1.0 kg, water 3.5 kg, food 1.83 kg, waste 0.12 kg.

## Numbers we measured

- Storm: 81 days, sols 180–260.
- Solar availability: 0.25 flat on every storm day. About 0.92 on clear days. Treat as a switch, not irradiance physics.
- O2 use: mean **89.1 kg/day** for 100 people. Textbook 0.84 × 100 = 84. Activity is often 1.15, which explains the extra. Document that if a judge checks the arithmetic.
- Food is a constant 183 kg/day (1.83 × 100). No storm effect.
- Water 332.5 or 367.5 kg/day. Two levels, activity-driven.
- O2 recovery 0.86–0.92. Water recovery 0.90–0.95. Makeup mass never exceeds consumption.
- Ventilation 1,980 m³/h clear, 2,430 m³/h storm.
- Cabin CO2 proxy: 760–1,218 ppm. Mild indoor stress, not a runaway cabin. Peak 1,218. A "crisis greenhouse" demo needs you to amplify this or add a failure mode.
- Window totals: 65,052 kg O2 consumed, 259,000 kg water used, 5,579 kg net O2 makeup, 14,300 kg net water makeup.

`day` and `sol` are identical. 24-hour days, not 24 h 40 m sols.

## What ML can honestly do here

Forecast `net_o2_makeup_kg`, `net_water_makeup_kg`, or `cabin_co2_ppm_proxy` from activity, storm flag, and solar. Then show a 730-day margin chart that goes red in the storm window.

Or control `greenhouse_ventilation_m3_per_h` as the decision: a policy that raises ventilation when the CO2 proxy and storm flag rise.

Do not present this as measured Mars500 physiology.

## Pair with our earlier data

REMS daily weather in `data/raw/weather/curiosity-rems-daily.csv` is real Gale-crater temperature and pressure. pvlib is installed if someone wants a less cartoon solar series than the 0.25 storm switch. This ECLSS table is the crew-side mass balance.

## Gotchas

- CO2 proxy is too polite for a disaster story.
- Storm solar is a constant 0.25.
- Mean O2 is above the 84 kg/day baseline because activity > 1.
- `load_example.py` uses `o2_consumption_kg`, which is the real column name. Manifest totals use the same figures.
