# Discovery: Track B, AI4MARS images and trip timetable

Local path: `data/raw/official-packs/extracted/track-b-vehicles-ai4mars/track-b-vehicles-ai4mars/`

Source pack: [track-b-vehicles-ai4mars.zip](https://github.com/melaniepreen/mars-sim-girlswhomlphysicsx-hack/blob/main/guided-packs/track-b-vehicles-ai4mars.zip)

## What they say it is

Two products glued together.

1. Rover ground pictures with terrain labels, sliced from [AI4MARS](https://data.nasa.gov/dataset/ai4mars-a-dataset-for-terrain-aware-autonomous-driving-on-mars).
2. A 730-sol logistics timetable for 100 people.

The images are a real slice. The timetable is invented. NASA portal licence is "not specified". Cite Swan, Ono, Atha et al. via [Zenodo 10.5281/zenodo.15995035](https://doi.org/10.5281/zenodo.15995035). The Hugging Face mirror they sliced from is unofficial.

## Files

| File | Role |
| --- | --- |
| `images/*.jpg` | 60 RGB frames, all 256×256 |
| `labels/*.png` | Matching masks, all 256×256 |
| `label_legend.json` | 0 soil, 1 bedrock, 2 sand, 3 big_rock, 255 unlabeled |
| `logistics_duty_cycle_100p_730sol.csv` | 3,130 simulated trips |
| `manifest.json` | 48 real + 12 synth, 3,130 trips |
| `DATA_NOTES.txt` | Pack readme |

## Images

48 `ai4mars_000`–`047` frames from the HF train split. 12 synthetic: 8 `synth_clear_*` and 4 `synth_dust_*`. Every image has a label with the same stem.

Real masks use classes 0, 1, 2, 3, and 255. That is enough to colour a demo overlay.

Synthetic masks are a trap. All eight clear synth masks are **byte-identical**. All four dust synth masks are **byte-identical** to each other. Dust frames only change the RGB. A model can memorise one geometry and look brilliant on synth-only accuracy. Do not report that number.

48 labelled frames is too small to train a segmenter from scratch in two hours. Fine for few-shot scoring, a colour overlay, or transfer learning if someone already has weights. There are no checkpoints in the pack.

## Trip table

Columns: `trip_id`, `sol`, `trip_index`, `crew_served`, `route_km`, `payload_kg`, `terrain_risk_score`, `energy_kwh`, `dust_storm_flag`, `battery_soh`.

- 3,130 trips, every sol 0–729 covered.
- 4 or 6 trips per sol (mean 4.29).
- `crew_served` is always 100.
- Route 0.8–6.5 km. Payload 40–220 kg. Risk 0.10–1.00. Energy 9.1–23.9 kWh.
- Storm: 348 trips, same 81 sols. Storm trips burn more energy (17.8 vs 15.9 kWh) and carry higher risk (0.73 vs 0.50).
- Battery SOH starts at 1.00 and ends at 0.682. Linear decay. No trip is failed for low battery.

No nulls. Risk stays in [0, 1].

## What ML can honestly do here

Score a trip: predict `energy_kwh` or `terrain_risk_score` from distance, payload, storm flag, and SOH. Then show a timetable that reroutes or parks during sols 180–260.

Use the 48 real frames as the visual for "this is the ground the rover sees." Do not hang the demo on synth accuracy.

If the crew wants a proper cost-surface model, Track B2 is the better table. This pack is the camera + duty-cycle story.

## Gotchas

- Images are 256×256. Do not claim Navcam or HiRISE native resolution.
- Battery never fails a trip. Add that failure mode yourself if the demo needs it.
- Terrain risk in the CSV is not computed from the images. The two halves are not joined by a key.
