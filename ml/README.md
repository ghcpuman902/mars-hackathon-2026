# Local ML environment

Python 3.12 venv at `../.venv`. Do not use system `python3` (3.14).

```bash
source .venv/bin/activate
python ml/smoke_test.py
python ml/prepare_demo_layers.py
python ml/examples/weather_baseline.py
```

`mars_data.py` is the only module you need to import for rasters and tables.
