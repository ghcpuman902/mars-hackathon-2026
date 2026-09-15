# Mars City Hackathon

Context for later agents. Do not invent a product here. The crew still has to pick a track and one ML decision.

Official source of truth: [docs/hackathon/Mars_Hackathon_Mission_Brief.pdf](./hackathon/Mars_Hackathon_Mission_Brief.pdf), scraped from [physicsxgwml.vercel.app](https://physicsxgwml.vercel.app/) on 15 Sept 2026.

## What this night is

GirlsWhoML × PhysicsX, supported by Cursor. One evening in London. Theme:

**If commercial space flights land on Mars tomorrow, what would you build to create the Martian city?**

The premise in the brief is sharper than the landing-page slogan. Commercial flights mean the first settlement is planned, not inherited. Survival is assumed. The hard question is how to build a place people actually want to live, using the planet instead of hauling Earth habits 60 million km. The brief even asks whether a luxury hotel is the first thing Mars needs, or the last.

You design **one core system**, not a whole city. Combine engineering, machine learning, or 3D modelling. The window is 2 hours 10 minutes of hacking.

Site: [physicsxgwml.vercel.app](https://physicsxgwml.vercel.app/)
Register / venue: [luma.com/cvpxxlpq](https://luma.com/cvpxxlpq) (registration closed)
Brief PDF: [Mars_Hackathon_Mission_Brief.pdf](https://physicsxgwml.vercel.app/assets/Mars_Hackathon_Mission_Brief.pdf)

## Clock

Tuesday 15 September 2026, London.

| Time | Phase | What happens |
| --- | --- | --- |
| 17:30 | Launch pad | Doors, food, crew formation |
| 18:00 | Mission briefing | PhysicsX intro, GirlsWhoML and challenges, Q&A, **rubric published** |
| 18:20 | Ignition | Hacking starts. Mentors on the floor |
| 20:00 | Mid-mission check | Optional 5 min mentor check-in |
| 20:30 | Code freeze | Push. Hard cutoff **20:35**, last commit timestamp |
| 20:38 | Demos | 3 min build + 2 min Q&A per crew |
| 21:30 | Judging | Room judges pick top 3 per room |
| 21:45 | Close | Winners, prizes. Venue clear by 22:00 |

Mentors are on the floor 18:15–20:30. PhysicsX plus 3D-modelling and ML support.

## Suggested checkpoints

From the brief. The 20:00 target is the one that matters.

| By | Checkpoint | Crew should have |
| --- | --- | --- |
| 18:35 | Scope locked | Track, one clear build, the single decision ML will drive. Repo + README started |
| 19:15 | Skeleton up | Rough 3D / diagram, plus a data plan: what ML predicts or optimises, and what feeds it |
| 20:00 | Core working | ML component runs end to end, even if crude, and the result informs the design |
| 20:25 | Freeze-ready | Demo path decided, README updated, commits staged before 20:35 |
| 20:38 | Demo | 3-minute walkthrough + 2-minute Q&A |

Running out of time with nothing that works is the failure mode they name in the brief.

Freeze form: [final-checklist.md](./hackathon/final-checklist.md). Track and data-used fields must be filled before the 20:35 push.

## Tracks

Commit to **one**. Each is a layer of a working city.

**Architecture.** Habitats and shelter. Pressurised living space, radiation shielding, insulation against −60 °C nights, structures printed or sintered from regolith rather than shipped from Earth. ML examples: wall thickness vs radiation and internal pressure, modular pod layout for fastest liveable volume, thermal stability of a lava-tube shelter across the day–night cycle. Example builds: printed regolith dome, modular pod colony, sheltered sub-surface habitat.

**Vehicles & Mobility.** People, cargo, and robots across broken, unmapped ground on limited power. ML examples: classify terrain from imagery, autonomous route scored by safety and energy, payload vs battery range. Example builds: route-scoring rover, cargo pod that trades load for range, swarm that digs, hauls, and builds in parallel.

**Life Support & Resource Systems.** Closed loops for energy, water, oxygen, food. Buried ice and thin CO2 become resources. ML examples: forecast ice yield by location, microgrid that predicts demand and allocates power, tune light / water / CO2 in a closed greenhouse. Example builds: ice-yield map, demand-aware solar microgrid, self-balancing greenhouse.

The brief's instruction for ML: use it to make **one real decision better than a guess**.

## Judging

50 points. Rubric is supposed to be posted at 18:00 so it is known before coding. The version already in the brief:

| # | Criterion | What they want | Score |
| --- | --- | --- | --- |
| 1 | Impact & Purpose | A real first-settlement problem, needed before comfort or novelty | /10 |
| 2 | Innovation & Creativity | Fresh take. Local resources, ML, or design used in an unexpected way | /10 |
| 3 | Technical Execution | It actually runs in the time given. Model, code, or CAD holds together in the demo | /10 |
| 4 | Feasibility & Real-World Potential | Credible path from first landing toward a real settlement | /10 |
| 5 | Team & Collaboration | Cross-disciplinary work. Bonus /5 for pitch, still scored /10 | /10 |

Judges listed on the site: Olivia Lihn, Tanvi Bansal, Elina Denisova, Morissa Chen (PhysicsX), Megha Mishra (GirlsWhoML). 3–5 judges in-room from 20:38.

The site FAQ also says they judge on technicality and feasibility, and they want at least one technical person on the crew.

## Rules that change how we build

- **Build tonight.** Output and repos must be made during the event. Prior research can inspire. Disclose if this is a pre-existing startup idea.
- **Crew size.** Official brief: 2–3, solo allowed, no crews of 4+. The website FAQ still says 2–5. Luma says 2–3. Prefer the brief unless they announce otherwise at 18:00.
- **Allowed tools.** Cursor, Blender, CAD, Figma, any IDE, other AI tools. Everyone gets $50 Cursor credits.
- **Submission.** Brief: public repo under the event org, named like `mars-hack-crew-name`. README must cover what you built, which category, how ML was used, and how to run or view the demo. Cutoff is the last commit timestamp at 20:35. A template repo is meant to be shared at 18:00. The website FAQ still has placeholder Devpost/form copy. Trust the brief and whatever they say at briefing.
- **Demo.** 3 minutes + 2 minutes Q&A. What is on screen at minute two has to be stable.
- **Ownership.** Submitting grants organisers the right to publish the work and access the repo.
- **Photos.** Luma registration includes photo consent. Tell organisers if you do not want to be photographed.

Prizes from PhysicsX include career coaching and mentorship. More TBA.

## Suggested tools from the brief

You do not need these. Pick one or two that fit the track.

Mars data: SpiceyPy, GDAL / rasterio, OpenPlanetary / Mars Trek, NASA PDS, pvlib.

Simulation: Gazebo + ROS 2, PyBullet / MuJoCo, OpenFOAM, FEniCS / CalculiX.

CAD / 3D: Blender, FreeCAD, CadQuery / build123d, OpenSCAD, Onshape.

ML: scikit-learn, XGBoost / LightGBM, PyTorch / TensorFlow, Optuna.

This repo is a Next.js 16 + Tailwind 4 + shadcn starter. If the product is a web demo of a decision (route score, ice-yield map, habitat layout), that is a legitimate shape. If the product is CAD or a Python model, this repo can still be the demo shell or the README home.

## Partners and people

PhysicsX is the headline partner. AI-native engineering software for physical product design.

GirlsWhoML is the community partner. Representation of women and underrepresented groups in ML.

Organising crew named on the site: Vanessa Lewis, Saskia Munks, Melanie Preen, Karina Singhani, Mathusa Thiruchenthoor, Shreya Vashist.

## What this repo is right now

A Next.js starter. `app/page.tsx` is still the placeholder card. No track, no product, no ML decision. See [docs/skills.md](./skills.md) for the global skills to use when the crew writes the goal and polishes the UI.

Mars rasters and a Python 3.12 ML env are already on this laptop. Official guided packs landed during the event. Start at [docs/hackathon/official-packs.md](./hackathon/official-packs.md). Catalogue: [docs/hackathon/datasets.md](./hackathon/datasets.md).

## Conflicts in public copy

The landing page still has placeholder FAQ text (`[time]`, `[Devpost/Devfolio/form link]`, `[Meals/refreshments provided.]`). Treat those as unfinished site copy, not instructions.

If briefing at 18:00 contradicts this file, update this file and follow the live brief.
