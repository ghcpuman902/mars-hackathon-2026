# Mars Sim Pack - GirlsWhoML x PhysicsX Hack

Participant dataset and simulation starter kit for the **GirlsWhoML x PhysicsX Mars Hackathon** (London - 15 September - supported by Cursor).

> **Mission brief PDF:** [`Mars_Hackathon_Mission_Brief.pdf`](./Mars_Hackathon_Mission_Brief.pdf) - tracks, tools, schedule, rules, and judging.
>
> **License / credits / gotchas:** [`LICENSE`](./LICENSE) - [`CREDITS.txt`](./CREDITS.txt) - [`KNOWN_ISSUES.txt`](./KNOWN_ISSUES.txt)

---

## Start here tonight

1. Read the **TL;DR** and pick **one track**.
2. Choose **Open Sandbox** (PDF tools) or **Guided Trajectory** (download one zip below).
3. Open `DATA_NOTES.txt` in that zip. Skim [`KNOWN_ISSUES.txt`](./KNOWN_ISSUES.txt) so you do not overclaim the data.
4. Load the CSV (or images). Make one ML decision drive your build. Push before **20:35** (mission brief section 08).

---

## TL;DR - What Mars is actually like

- **Air:** Atmosphere exists, but ~1% of Earth's pressure. Almost all CO2, basically no oxygen. Unbreathable even if it weren't so thin.
- **Temperature:** Averages about -60 C. Can hit +20 C at noon near the equator; drops below -100 C at night. Huge swings because thin air can't hold heat.
- **Radiation:** No global magnetic field and barely any atmosphere, so little shielding from cosmic and solar radiation. Habitats need thick walls or underground shelter.
- **Gravity:** ~38% of Earth's.
- **Terrain:** Rocky, dusty, craters, cliffs, canyons. No roads; rovers navigate real hazards.
- **Dust storms:** Can wrap the planet for weeks and block sunlight, which is critical for anything solar-powered.
- **Day length:** A "sol" is ~24 h 40 m, close to Earth, but the night temperature crash is brutal.

**Design preconditions (all tracks):** treat this as a real first city, not a 3-person demo.

1. **100 people** live here. Size habitats, fleets, and life support for a settlement.
2. **~2 Earth years (730 sols)** until the next cheap resupply. Your system has to last that gap.
3. **One dust-storm season** sits inside that window (sols **180-260** in these packs). Sunlight dies. Dust gets bad. Design for it.

---

## Pick your pack

Two ways to work. Same brief, different levels of freedom.

### 1. Open Sandbox Pack

*Freedom to choose your own weights, assumptions, and conditions.*

Use the mission brief PDF as your toolkit map. Pick the libraries and data sources that fit your idea: SpiceyPy, GDAL/rasterio, Gazebo/ROS 2, PyBullet/MuJoCo, OpenFOAM, Blender, scikit-learn, PyTorch, Optuna, and the rest listed under **section 03 Tools and Resources** in [`Mars_Hackathon_Mission_Brief.pdf`](./Mars_Hackathon_Mission_Brief.pdf).

### 2. Guided Trajectory Pack

*Recommended datasets per track - less wrangling, more building.*

Download **one zip** for your track (already sized to the 100-person / 730-sol / dust-storm precondition). Open `DATA_NOTES.txt` inside first. Peek at folders: [`guided-packs/`](guided-packs/).

| Track | Download | Source |
| --- | --- | --- |
| **A - Architecture** | [track-a-architecture-emars.zip](guided-packs/track-a-architecture-emars.zip) | [EMARS](https://rmets.onlinelibrary.wiley.com/doi/10.1002/gdj3.77) |
| **B - Vehicles and Mobility** | [track-b-vehicles-ai4mars.zip](guided-packs/track-b-vehicles-ai4mars.zip) | [AI4MARS](https://data.nasa.gov/dataset/ai4mars-a-dataset-for-terrain-aware-autonomous-driving-on-mars) |
| **C - Life Support** | [track-c-life-support-hre.zip](guided-packs/track-c-life-support-hre.zip) | [ESA HREDA / Mars500](http://esdcdoi.esac.esa.int/doi/html/data/hre/hreda/8b3a6c3f-e7a0-4fb1-8693-8edd6515d06d.html) |

#### Track A - `track-a-architecture-emars.zip`

**What:** Spreadsheet-style weather for one Mars settlement site.

**Type:** Numbers over time (CSV / parquet) - temperature, wind, pressure, dust, plus a heating-load estimate for 100 people. One row per hour for ~2 years (730 sols). Storm days are flagged (sols 180-260).

**Useful for:** Habitat / architecture work - when it gets freezing, dusty, or stormy, so you can size walls, insulation, or a "seal the bunker restaurant" rule from real-feeling Mars weather.

#### Track B - `track-b-vehicles-ai4mars.zip`

**What:** Two things together:

1. **Pictures** of Mars ground from rover cameras, with **label images** saying what is soil, bedrock, sand, or rock.
2. A **trip timetable** CSV - thousands of cargo/EVA-style runs over 730 sols for 100 people (distance, payload, energy, risk, battery wear, storm flag).

**Type:** Images + masks (vision data) and a logistics table (tabular).

**Useful for:** Vehicles / mobility - teach a model "is this path safe?" then score a rover or Mars-train route for energy and risk over a long duty cycle, including dust storms.

#### Track C - `track-c-life-support-hre.zip`

**What:** A daily life-support log for 100 people across 730 days.

**Type:** Numbers table (CSV) - O2, CO2, water, food, waste, how much solar is available, greenhouse ventilation, cabin CO2 proxy. Storm days cut solar and stress air.

**Useful for:** Life support - forecast shortages, balance a closed loop, or run indoor greenhouse air through a solar blackout.

**What is real vs ready-made:** Track B includes 48 real AI4MARS image+label pairs. Tracks A and C (and Track B's trip timetable) are hack-ready tables built from those sources, because the full archives are huge or login-gated. Citations: [`CREDITS.txt`](./CREDITS.txt).

---

## Example ideas - go crazy

Prompts, not ceilings. Remix them.

- **Track A:** Mars storm-bunker restaurants that seal when dust walls hit.
- **Track B:** Self-driving train across Mars, scoring every stretch of trackbed.
- **Track C:** Greenhouse ventilation that keeps crew and crops alive through solar blackouts.

---

## Know before you overclaim

Full list: [`KNOWN_ISSUES.txt`](./KNOWN_ISSUES.txt). Short version:

- **A:** simulated weather; storm barely mutes day-night swing; 24 h grid, not a true 24 h 40 m sol.
- **B:** only 48 real images; synthetic masks are identical; trip timetable is invented for the 100-person / 730-sol brief.
- **C:** not raw Mars500 telemetry; CO2 proxy stays mild; cite NASA rate priors + HREDA framing.

Still useful: shared assumptions so every crew designs for **100 people**, **730 sols**, and **one dust season**.

Full problem framing, schedule, and judging rubric: the PDF. Mentors cover PhysicsX, 3D modelling, and ML support.

---

*Not affiliated as an official PhysicsX product. Community starter pack for GirlsWhoML x PhysicsX participants. Original pack content: MIT. Upstream datasets: see CREDITS.txt.*
