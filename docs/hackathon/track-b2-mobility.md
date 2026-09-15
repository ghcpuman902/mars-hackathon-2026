# Discovery: Track B2, synthetic mobility grid

Local path: `data/raw/official-packs/extracted/track-b2-mobility-ai4mars/track-b2-mobility-ai4mars/`

Source pack: [track-b2-mobility-ai4mars.zip](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack/blob/main/guided-packs/track-b2-mobility-ai4mars.zip)

Not listed in the GitHub README table. It is in `guided-packs/` and it is the cleanest supervised set of the night: labelled routes, a cost surface, four vehicle classes.

Fully synthetic. Seeded generator promised as `generate_dataset.py`. **That script is not in the zip.** README only.

## What they say it is

A 1.2 km × 1.2 km patch (60×60 cells, 20 m each) plus 1,500 candidate routes. Built for "plan an autonomous route scored by safety and energy cost." Schema is meant to look like something you could later swap for HiRISE/MOLA.

## Files

| File | Rows | Role |
| --- | --- | --- |
| `terrain_grid.csv` | 3,600 | Per-cell elevation, slope, type, hazard, Wh/m |
| `vehicles.csv` | 4 | Scout, hauler, crew transport, swarm builder |
| `routes.csv` | 1,500 | Point-to-point candidates with success labels |
| `README.md` |  | Schema and suggested sklearn snippets |

## Terrain grid

Columns include `cell_id`, `grid_x`, `grid_y`, `elevation_m`, `slope_deg`, `terrain_type`, `rock_density`, `dust_depth_cm`, `solar_exposure_pct`, `surface_temp_c`, `hazard_prob`, `safety_score`, `traversal_energy_wh_per_m`.

Elevation −70 m to +38 m. Slope 0.07° to 58.5°. Hazard 0–0.55. Traversal energy 0.84–5.84 Wh/m (mean 1.75).

Terrain counts we measured:

| Type | Cells |
| --- | --- |
| regolith_plain | 2,688 |
| rock_field | 623 |
| crater_floor | 166 |
| crater_rim | 110 |
| dune_field | 13 |

README also names `dust_pit` and `lava_tube_entrance`. Those classes are **absent**. Almost everything is regolith. A classifier that always guesses `regolith_plain` will look strong and be useless.

## Vehicles

| Type | Mass kg | Battery Wh | Max payload kg | Efficiency mult |
| --- | --- | --- | --- | --- |
| light_scout | 180 | 3,500 | 40 | 0.85 |
| cargo_hauler | 950 | 14,000 | 600 | 1.30 |
| crew_transport | 620 | 9,500 | 250 | 1.10 |
| swarm_builder | 75 | 1,200 | 15 | 0.75 |

Swarm units are the interesting failure case.

## Routes

1,500 rows. 840 `optimized`, 660 `naive`. Endpoints on the grid. Targets: `total_energy_wh`, `energy_margin_pct`, `safety_score`, `mission_success`.

Overall success 63.9%. Optimized 69.5%, naive 56.7%. That gap is the talking point they planted.

Success by vehicle, measured here:

- cargo_hauler 84.0%
- crew_transport 83.9%
- light_scout 70.8%
- swarm_builder **21.7%**

Failed routes have a median energy margin of −35%. Successful ones sit around +70%. The label is mostly "did the battery last," not subtle terrain physics.

Dominant terrain on routes: 1,456 regolith, 30 rock, 14 crater floor. Same imbalance as the grid.

Energy margin ranges from −798% to +95%. A few routes are wildly infeasible. Good for a red/green map. Bad if you average without clipping.

## What ML can honestly do here

This is the pack to train in under ten minutes.

1. Predict `traversal_energy_wh_per_m` or `hazard_prob` from slope, rock, dust, terrain type. That is a cost surface.
2. Predict `mission_success` from distance, slope, rock, payload fraction, battery. Compare optimized vs naive.
3. Predict energy vs payload. "How much can this rover carry this far."

Then draw the 60×60 grid in the Next app and overlay a path. Our MOLA/SWIM layers are global. This grid is the local planner toy.

sklearn snippet in their README works with what we already have in `.venv`.

## Gotchas

- Synthetic. Say so in the demo.
- Class imbalance. Almost all regolith.
- `generate_dataset.py` is missing, so you cannot regenerate with a new seed unless you rewrite it.
- `__MACOSX` junk in the zip. Ignore it.
