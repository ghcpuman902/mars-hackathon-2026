"""Clone the organiser pack repo so the guided packs are available locally.

Populates data/raw/official-packs/extracted/<track>/ from the source repo's
guided-packs/ folder. Both locations are gitignored. Safe to re-run.
"""
from __future__ import annotations

import shutil
import subprocess
import sys

from paths import REPO, SOURCE_REPO, TRACK_A, TRACK_B, TRACK_B2, TRACK_C

SRC = REPO / "data" / "raw" / "official-packs" / "source"
DST = REPO / "data" / "raw" / "official-packs" / "extracted"


def main() -> None:
    if not (SRC / "guided-packs").exists():
        SRC.parent.mkdir(parents=True, exist_ok=True)
        print(f"cloning {SOURCE_REPO} -> {SRC}")
        subprocess.check_call(["git", "-c", "core.longpaths=true", "clone", "--depth", "1", SOURCE_REPO, str(SRC)])
    DST.mkdir(parents=True, exist_ok=True)
    for track in (TRACK_A, TRACK_B, TRACK_B2, TRACK_C):
        s, d = SRC / "guided-packs" / track, DST / track
        if not s.exists():
            print(f"missing in source: {track}", file=sys.stderr)
            continue
        if d.exists():
            shutil.rmtree(d)
        shutil.copytree(s, d)
        print(f"copied {track}")
    print("done:", DST)


if __name__ == "__main__":
    main()
