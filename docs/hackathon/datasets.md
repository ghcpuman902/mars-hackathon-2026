# Datasets and ML stack on this laptop

Companion to [docs/hackathon.md](../hackathon.md) and [data/README.md](../../data/README.md). Written so a later agent can start scoring sites without hunting URLs.

## Official packs (use these first)

The event published guided zips after briefing. Discovery reports:

- Index: [official-packs.md](./official-packs.md)
- Track A weather: [track-a-emars.md](./track-a-emars.md)
- Track B images + trips: [track-b-ai4mars.md](./track-b-ai4mars.md)
- Track B2 grid + routes: [track-b2-mobility.md](./track-b2-mobility.md)
- Track C ECLSS: [track-c-eclss.md](./track-c-eclss.md)

Shared scenario: 100 people, 730 sols, dust storm sols 180–260. A and C are simulated. B images are real and tiny. B2 is fully synthetic and the easiest thing to train tonight.

Source: [melaniepreen/mars-sim-girlswhomlphysicsx-hack](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack)

## Disk

Checked 15 Sept 2026, before download: 74 GB free on `/System/Volumes/Data` (92% used). Budget kept under ~1 GB. After install: rasters ~430 MB, `.venv` ~423 MB.

## Frameworks

Python **3.12** venv at `.venv` (3.14 is the default `python3` on this machine; wheels for rasterio / sklearn are safer on 3.12).

```bash
source .venv/bin/activate
.venv/bin/python ml/smoke_test.py
```

Pinned in `ml/requirements.txt`:

- numpy, pandas, scikit-learn, matplotlib, pillow
- xgboost, lightgbm, optuna
- rasterio, shapely, pyproj
- pvlib (solar, Life Support track)
- joblib

No PyTorch. Revisit only if the crew picks image terrain classification.

## How this maps to the brief

| Track | Local data that can drive one ML decision |
| --- | --- |
| Architecture | MOLA elevation + slope, SWIM ice (shielding / construction water), crater density, lava-tube candidate pins |
| Vehicles | MOLA slope, crater density within a radius, ice as a destination not a road |
| Life Support | SWIM ice yield-by-location, REMS temperature/pressure vs solar longitude, pvlib for insolation |

The brief's example "forecast ice yield by location" is the one this cache is strongest for.

## Sampled demo table

`data/processed/sites_scored.csv` and `public/data/sites_scored.json` already join 20 sites to elevation, local slope, three SWIM depths, and crater counts. Ice is a consistency score, about −1 to +1, not tonnes. Polar rows are NaN because SWIM is roughly ±60°.

Olympus came out at +20 088 m and Hellas at −6 072 m. Arcadia / Deuteronilus / Phlegra read ice-positive. Jezero / Oxia read ice-negative. That is the expected pattern.

## Commands

```bash
.venv/bin/python ml/smoke_test.py
.venv/bin/python ml/prepare_demo_layers.py
.venv/bin/python ml/examples/weather_baseline.py
```
