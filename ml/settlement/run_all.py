"""Reproduce every number behind the Sol Zero Console, end to end.

    python ml/settlement/run_all.py

Order: fetch packs -> descriptive analysis -> terrain models -> storm/ECLSS
models -> export the site's data file. Takes about a minute on a laptop.
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

STEPS = ["fetch_packs", "analyse_packs", "train_terrain_cost", "train_storm_models", "export_console_data"]

for step in STEPS:
    print(f"\n=== {step} ===")
    runpy.run_path(str(HERE / f"{step}.py"), run_name="__main__")
