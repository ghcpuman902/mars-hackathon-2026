# Official guided packs

The organisers published a starter kit during the event:

[github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack)

Downloaded onto this laptop on 15 Sept 2026 into `data/raw/official-packs/`. About 5 MB unzipped. That is the shared scenario every crew is supposed to design against.

Upstream notes (copied locally): [CREDITS.txt](./official-source/CREDITS.txt), [KNOWN_ISSUES.txt](./official-source/KNOWN_ISSUES.txt), [README.md](./official-source/README.md).

## Shared preconditions

These apply to every pack. Judges will hear them.

1. **100 people** live here. Size habitats, fleets, and life support for a settlement, not a 3-person demo.
2. **730 sols** until the next cheap resupply. About two Earth years.
3. **One dust-storm season**, sols **180–260** (81 sols). Sunlight dies. Dust gets bad.

Air is ~1% of Earth pressure, mostly CO2. Mean temperature about −60 °C. Gravity 0.38 g. A sol is ~24 h 40 m in reality. The tables use 24 civil hours.

## Packs on disk

| Track | Zip | Discovery report | What it actually is |
| --- | --- | --- | --- |
| A Architecture | `track-a-architecture-emars.zip` | [track-a-emars.md](./track-a-emars.md) | Simulated hourly weather at Jezero-band 18.4°N 77.5°E |
| B Vehicles | `track-b-vehicles-ai4mars.zip` | [track-b-ai4mars.md](./track-b-ai4mars.md) | 48 real AI4MARS frames + 12 synth + invented trip timetable |
| B2 Mobility | `track-b2-mobility-ai4mars.zip` | [track-b2-mobility.md](./track-b2-mobility.md) | Fully synthetic 60×60 grid, 4 vehicles, 1,500 labelled routes |
| C Life Support | `track-c-life-support-hre.zip` | [track-c-eclss.md](./track-c-eclss.md) | Simulated daily ECLSS table, not Mars500 telemetry |

README on GitHub only lists A, B, and C. B2 is in the same folder and is the cleanest supervised-learning pack of the four.

## Honest line for judges

Tracks A and C are **hack-ready simulations** informed by EMARS / NASA rate priors / HREDA framing. Track B's images are real and resized. Track B's trips and all of B2 are invented. Cite [CREDITS.txt](./official-source/CREDITS.txt). Do not claim flight-qualified science.

## Paths

```
data/raw/official-packs/zips/
data/raw/official-packs/extracted/track-a-architecture-emars/...
data/raw/official-packs/extracted/track-b-vehicles-ai4mars/...
data/raw/official-packs/extracted/track-b2-mobility-ai4mars/...
data/raw/official-packs/extracted/track-c-life-support-hre/...
```

Each zip unpacks one extra nested folder with the same name.

Earlier local data (MOLA, SWIM, Robbins, REMS) is still valid for Open Sandbox. See [datasets.md](./datasets.md).

Before you push: fill [final-checklist.md](./final-checklist.md) (track, data used, honest line for judges).
