# Local Mars data

Downloaded 15 Sept 2026 so tonight's hack can run offline. Disk had 74 GB free; this tree is about 430 MB of rasters plus a 423 MB Python env.

Activate the env from the repo root:

```bash
source .venv/bin/activate
# or
.venv/bin/python ml/smoke_test.py
```

Raw rasters and official pack extracts are gitignored. The small site table and processed demo layers are kept.

Official guided packs live under `raw/official-packs/`. Read [docs/hackathon/official-packs.md](../docs/hackathon/official-packs.md) before training anything.

## What is on disk

| Path | What | Size | Use |
| --- | --- | --- | --- |
| `raw/mola/megt90n000cb.img` | MOLA topography, 4 ppd, metres | 2 MB | Fast global maps |
| `raw/mola/megt90n000eb.img` | MOLA topography, 16 ppd, metres | 32 MB | Site elevation and slope |
| `raw/swim/SWIM4MIM_Ci_0_1.tif` | SWIM ice consistency, 0–1 m | 68 MB | Shallow ice / ISRU |
| `raw/swim/SWIM4MIM_Ci_1_5.tif` | SWIM ice consistency, 1–5 m | 68 MB | Excavation-depth ice |
| `raw/swim/SWIM4MIM_Ci_5.tif` | SWIM ice consistency, >5 m | 68 MB | Deeper ice |
| `raw/craters/Catalog_Mars_Release_2020_1kmPlus_FullMorphData.csv` | Robbins 2020 craters ≥1 km | 93 MB | Landing / traverse hazards |
| `raw/weather/curiosity-rems-daily.csv` | Curiosity REMS daily weather | 100 KB | Thermal / dust baseline |
| `raw/sites/candidate-sites.csv` | 20 named sites we curated | tiny | Demo pins |

Processed copies for the Next.js app live in `data/processed/` and `public/data/`.

## Loaders

```bash
.venv/bin/python ml/smoke_test.py
.venv/bin/python ml/prepare_demo_layers.py
.venv/bin/python ml/examples/weather_baseline.py
```

`ml/mars_data.py` samples elevation, slope, SWIM ice, and nearby craters at a lat/lon.

## What I did not download

- THEMIS 100 m thermal-inertia tiles. Each 30°×60° tile is huge.
- Full HiRISE / CTX DTMs. One landing-site DTM is hundreds of MB to a few GB.
- MOLA 32/64/128 ppd. 16 ppd is enough for global siting.
- TES WMS rasters. The ASU map server stalled.
- PyTorch / TensorFlow. The brief's "one ML decision" is tabular. sklearn + LightGBM + XGBoost + Optuna are installed.

If briefing at 18:00 names a specific site, grab one HiRISE DTM then, not before.

## Sources

- MOLA MEGDR: [PDS Geosciences](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html)
- SWIM: [swim.psi.edu](https://swim.psi.edu/SWIM4MIMProducts.php)
- Robbins craters: [craters.sjrdesign.net](https://craters.sjrdesign.net/)
- REMS daily table: [the-pudding/data](https://github.com/the-pudding/data/tree/master/mars-weather)
