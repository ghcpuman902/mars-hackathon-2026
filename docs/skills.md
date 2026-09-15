# Global skills for later work

These skills already live on this machine, outside the repo. They apply in every Cursor project. Read the skill file before using it. Several of the interface ones are `disable-model-invocation: true`, so they only run when someone asks for them by name.

Two jobs later:

1. Write the project goal and lock the night's decisions.
2. Polish the app so it does not look like a generic AI demo.

## Write the project goal

Start here after the crew picks a track. Do not skip to UI.

**early-decision-locking.** Built for hackathon kickoff. Twenty minutes, one `LOCKS.md`. The hackathon playbook in that skill is the one to use: nouns, non-goals, demo invariant, machine authority, one validation command. Skip the ceremony that a weekend hack would need.

`~/.cursor/skills/early-decision-locking/SKILL.md`
`~/.cursor/skills/early-decision-locking/PLAYBOOKS.md`
`~/.cursor/skills/early-decision-locking/TEMPLATES.md`

Locks that matter tonight, mapped onto [docs/hackathon.md](./hackathon.md):

- Audience is the in-room judges and a 3-minute demo, not a production user.
- Budget is about 2 hours 10 minutes, with a working core by 20:00.
- One track. One build. One ML decision better than a guess.
- Non-goals should name auth, settings, extra tracks, and anything that cannot be on screen at minute two of the demo.

**write-clear-essays-and-explainers.** For the README, the 100-word summary, and the spoken demo. Concept first, then mechanism, then evidence.

`~/.cursor/skills/write-clear-essays-and-explainers/SKILL.md`

**unslop.** Run on any prose we ship: README, on-screen copy, pitch notes. Cuts the usual AI tells.

`~/.cursor/skills/unslop/SKILL.md`

**Cursor `/goal`.** Durable objective that survives across turns. Use after `LOCKS.md` exists, so the goal is the locked product, not a vague "build something for Mars".

`~/.cursor/skills-cursor/goal/SKILL.md`

## Interface skills we wrote

These are the ones on this machine that we authored for product UI. Use them to pick a direction, then to strip generic hierarchy, then to add motion only where it earns its keep.

**prototype.** Several genuinely different versions of one UI piece, behind a picker. Invoke explicitly. Never edits production code during exploration. Right move if the demo surface could go "dense dashboard" or "one decisive map" and we have not chosen.

`~/.cursor/skills/prototype/SKILL.md`

**de-slop-ui-hierarchy.** Structural AI-UI tells: nested cards, eyebrow + tracking, title-plus-subtitle stacks, dropdowns used for three options, controls sitting nowhere near what they change. Use this before adding chrome.

`~/.cursor/skills/de-slop-ui-hierarchy/SKILL.md`

**deslop.** Code slop in the diff: leftover comments, `any`, defensive try/catch on trusted paths. Run near freeze if the branch got messy.

`~/.cursor/skills/deslop/SKILL.md`

**pick-ui-library.** Do not add a second animation library or a second primitives set. This repo already has shadcn, Radix, Sonner, and `motion`. This skill decides CSS vs Motion vs a primitive you should not hand-roll.

`~/.cursor/skills/pick-ui-library/SKILL.md`

**preserve-native-touch-scroll.** If the demo has a slider, map, strip, or sheet, keep native page scroll. Judges will use laptops and phones.

`~/.cursor/skills/preserve-native-touch-scroll/SKILL.md`

### Motion, same family

Use these only after the core decision UI works. Most of them are explicit-invoke.

| Skill | Job | Path |
| --- | --- | --- |
| motion-brief | Interview one animation to a written brief. Does not write code. | `~/.cursor/skills/motion-brief/SKILL.md` |
| find-animation-opportunities | Read-only. Name the few places motion helps, and what must stay still. | `~/.cursor/skills/find-animation-opportunities/SKILL.md` |
| animate | Decision layer, then implementation. Load the companion recipe files it names. | `~/.cursor/skills/animate/SKILL.md` |
| css-animations | CSS-only motion. Default for hover, open/close, loops. | `~/.cursor/skills/css-animations/SKILL.md` |
| motion-react | `motion/react` when you need exit, layout, springs, or drag. Already in `package.json`. | `~/.cursor/skills/motion-react/SKILL.md` |
| web-animation-design | Broader craft reference. Easing, duration, purpose. | `~/.cursor/skills/web-animation-design/SKILL.md` |
| animation-accessibility | Every animation ships a reduced-motion variant. Keep meaning, drop travel. | `~/.cursor/skills/animation-accessibility/SKILL.md` |
| animation-performance | Composite-only properties. 60fps is the bar, not "fine on this laptop". | `~/.cursor/skills/animation-performance/SKILL.md` |
| animation-vocabulary | Name an effect from a loose description before prompting. | `~/.cursor/skills/animation-vocabulary/SKILL.md` |
| review-animations | Review existing motion against the craft bar. Does not implement. | `~/.cursor/skills/review-animations/SKILL.md` |
| improve-animations | Audit and write plans another agent can execute. | `~/.cursor/skills/improve-animations/SKILL.md` |

Suggested order if we polish motion at all: `find-animation-opportunities` → `motion-brief` on the one that matters for the demo → `animate` or `css-animations` / `motion-react` → `animation-accessibility`. Skip the review/improve pair unless something already feels wrong.

## Stack skills from plugins

Globally installed with the Vercel plugin. They match this repo's stack.

**nextjs.** App Router, server/client boundaries, caching. Still read `node_modules/next/dist/docs/` before changing Next.js behaviour.

Plugin path: Vercel `nextjs` skill (`~/.cursor/plugins/cache/cursor-public/vercel/*/skills/nextjs/SKILL.md`)

**shadcn.** Compose what is already in `components/ui/`. Do not add a second component kit.

**react-best-practices.** Checklist after editing several TSX files.

**verification.** End-to-end check of the demo path once something is on screen. Do not start the dev server unless a human asks. See `.cursor/rules/never-start-the-dev-server.mdc`.

**ai-sdk.** Only if the web app itself calls a model. The brief's ML examples are mostly tabular or image models, which may live in Python. Do not pull this in just because the theme mentions ML.

## Three.js (from tsl-dither)

The globe follows the TSL / WebGPU notes copied from `~/dev/nextjs/tsl-dither`, not React Three Fiber.

- Rule: [`.cursor/rules/three-shader-language.mdc`](../.cursor/rules/three-shader-language.mdc)
- Language note: [`.cursor/knowledge/tsl.md`](../.cursor/knowledge/tsl.md)

Read those before touching `components/mars-globe.tsx`. `three/webgpu` + `await renderer.init()` + dispose on unmount. Do not add R3F or a second 3D library (`pick-ui-library`: use what is already chosen).

Companion skills when the globe is on screen:

- **animation-performance.** Cap pixel ratio, skip decorative GPU loops (no star field).
- **animation-accessibility.** `prefers-reduced-motion` turns off orbit damping.
- **verification.** Check the live tab after a globe change. Do not start the dev server.

## How a later agent should use this

1. Read [docs/hackathon.md](./hackathon.md).
2. Ask the crew for track, one build, one ML decision. If those are missing, stop and run `early-decision-locking` instead of coding features.
3. Write `LOCKS.md` at the repo root from that skill's hackathon playbook.
4. Then, if asked, turn the locks into a Cursor `/goal`.
5. Build the thin demo path. Polish last with `de-slop-ui-hierarchy`, then one motion pass if time remains.
6. Write README and spoken demo with `write-clear-essays-and-explainers` + `unslop`.

Do not run the whole motion set. There is not time.
