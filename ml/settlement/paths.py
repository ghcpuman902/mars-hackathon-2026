"""Locate the organiser guided packs and the repo's output folders.

Search order for the packs:
  1. $MARS_PACKS                      (a folder holding track-a-architecture-emars/ etc.)
  2. data/raw/official-packs/extracted (the repo convention, gitignored)
  3. a local clone of the source repo   (guided-packs/ inside it)

Run ``python ml/settlement/fetch_packs.py`` to populate option 2 from GitHub.
"""
from __future__ import annotations

import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PROCESSED = REPO / "data" / "processed"
CONSOLE = REPO / "public" / "sol-zero-console"

TRACK_A = "track-a-architecture-emars"
TRACK_B = "track-b-vehicles-ai4mars"
TRACK_B2 = "track-b2-mobility-ai4mars"
TRACK_C = "track-c-life-support-hre"

SOURCE_REPO = "https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack.git"


def packs_root() -> Path:
    candidates = []
    if os.environ.get("MARS_PACKS"):
        candidates.append(Path(os.environ["MARS_PACKS"]))
    candidates.append(REPO / "data" / "raw" / "official-packs" / "extracted")
    candidates.append(REPO / "data" / "raw" / "official-packs" / "source" / "guided-packs")
    for c in candidates:
        if (c / TRACK_A / "emars_settlement_hourly_730sol.csv").exists():
            return c
    raise FileNotFoundError(
        "Guided packs not found. Run `python ml/settlement/fetch_packs.py` "
        "or set MARS_PACKS to a folder containing track-a-architecture-emars/."
    )


def pack(track: str) -> Path:
    return packs_root() / track


def ensure_out() -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    CONSOLE.mkdir(parents=True, exist_ok=True)
