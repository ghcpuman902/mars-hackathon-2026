import type { LandingSite } from "@/lib/mars-landing"
import type { SitePhysics } from "@/lib/site-physics"

export type SiteCopy = {
  headline: string
  why: string
  dirt: string
  caves: string
  quakes: string
  wind: string
  ice: string
  caveat: string
}

const metres = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  if (Number.isInteger(rounded)) {
    return `${rounded}`
  }
  return rounded.toFixed(1)
}

const iceLine = (site?: LandingSite) => {
  if (!site || site.ice_0_1m == null) {
    return "Ice was not sampled at this pin."
  }
  const shallow = site.ice_0_1m
  const mid = site.ice_1_5m ?? 0
  if (shallow >= 0.25) {
    return "Ice looks likely in the first metre. You can dig for water here."
  }
  if (mid >= 0.25) {
    return "Ice looks more likely a few metres down. A shallow trench may reach it."
  }
  if (shallow < 0 && mid <= 0) {
    return "The ice map is against you in the first few metres. Do not count on local water."
  }
  return "Ice is uncertain. Treat water as something you bring or make."
}

const quakeLine = (report: SitePhysics) => {
  const km = Math.round(report.seismic.distanceKm).toLocaleString()
  if (report.seismic.tier === "elevated") {
    return `You sit about ${km} km from the known quake belt. Design the roof as if the ground can shake.`
  }
  if (report.seismic.tier === "moderate") {
    return `About ${km} km from the known quake belt. Shaking is possible. It still will not beat a weak cave roof as the thing that fails first.`
  }
  return `About ${km} km from the known quake belt. Shaking will not set the design.`
}

const windLine = (report: SitePhysics) => {
  const mars = Math.max(1, Math.round(report.wind.peakPa))
  const earth = Math.round(report.wind.earthPeakPa)
  const times = Math.max(2, Math.round(earth / mars))
  return `A peak storm here pushes about ${mars} Pa. The same wind on Earth is about ${earth} Pa, roughly ${times} times harder. Walls fail from the air you keep inside, and from dust.`
}

const dirtLine = (report: SitePhysics) => {
  const radiationM = report.shieldingDepthM
  const thermalM = report.thermal.annualSkinM
  const flareCm = Math.round(report.sepShelterDepthM * 100)
  const flare = `A solar-flare closet needs about ${flareCm} cm.`
  const cave = report.cave

  if (cave.coversRadiation && cave.nearest) {
    const roof = cave.roofDepthM
    if (roof != null) {
      return `${cave.nearest.name} already has at least ${metres(roof)} m of rock over the floor. That beats the ${metres(radiationM)} m radiation pile. Live under the cave. ${flare}`
    }
    return `${cave.nearest.name} is a published pit. The floor stays in shadow, so we do not know the roof thickness. Plan a ${metres(radiationM)} m dirt pile unless you can measure the roof.`
  }

  if (radiationM <= 0) {
    return `Air at this elevation already keeps a worker under the yearly Earth radiation-work limit. Dig ${metres(thermalM)} m if you want the rooms to stop feeling the year. ${flare}`
  }

  if (thermalM > radiationM + 0.3) {
    return `Pile ${metres(thermalM)} m of dirt over the rooms. Radiation is covered by ${metres(radiationM)} m. The extra is so the year stops reaching the floor. ${flare}`
  }

  return `Pile ${metres(radiationM)} m of dirt over the rooms. That keeps a worker under the yearly Earth radiation-work limit. Temperature settles around the same depth. ${flare}`
}

const caveLine = (report: SitePhysics) => {
  return report.cave.note
}

const headline = (report: SitePhysics) => {
  if (report.cave.coversRadiation && report.cave.nearest) {
    return `Use ${report.cave.nearest.name}. Skip the dirt pile.`
  }
  const buryM = Math.max(report.shieldingDepthM, report.thermal.annualSkinM)
  if (buryM <= 0.3) {
    return "Build on the surface. Keep a flare closet."
  }
  return `Bury ${metres(buryM)} m.`
}

export const siteCopy = (
  report: SitePhysics,
  site?: LandingSite,
): SiteCopy => {
  const why = site?.why_it_matters
    ? site.why_it_matters
    : "This pin is yours. Terrain is the height map, with a little roughness so the ground reads at this scale."

  return {
    headline: headline(report),
    why,
    dirt: dirtLine(report),
    caves: caveLine(report),
    quakes: quakeLine(report),
    wind: windLine(report),
    ice: iceLine(site),
    caveat:
      "100 people, 730 sols, dust storm from sol 180 to 260. Depths are physics rules, not a site survey. Wind is a simulated Jezero storm.",
  }
}
