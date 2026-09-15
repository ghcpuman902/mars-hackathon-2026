import type { MarsCave } from "@/lib/mars-caves"
import type { LandingPick, LandingSite } from "@/lib/mars-landing"
import { siteCopy } from "@/lib/site-copy"
import { evaluateSite } from "@/lib/site-physics"

export type SiteReportProps = {
  site?: LandingSite
  pick: LandingPick
  elevationM: number | null
  caves: MarsCave[]
}

export const SiteReport = ({
  site,
  pick,
  elevationM,
  caves,
}: SiteReportProps) => {
  if (elevationM == null) {
    return (
      <p className="mt-2 text-sm text-stone-400" aria-live="polite">
        Sampling elevation…
      </p>
    )
  }

  const copy = siteCopy(
    evaluateSite(elevationM, pick.lat_deg, pick.lon_east_deg, caves),
    site,
  )

  return (
    <div className="mt-3 space-y-3 text-sm text-stone-300">
      <p className="text-base font-medium text-stone-100">{copy.headline}</p>
      <p>{copy.why}</p>
      <p>
        <span className="font-medium text-stone-100">Dirt. </span>
        {copy.dirt}
      </p>
      <p>
        <span className="font-medium text-stone-100">Caves. </span>
        {copy.caves}
      </p>
      <p>
        <span className="font-medium text-stone-100">Quakes. </span>
        {copy.quakes}
      </p>
      <p>
        <span className="font-medium text-stone-100">Wind. </span>
        {copy.wind}
      </p>
      <p>
        <span className="font-medium text-stone-100">Ice. </span>
        {copy.ice}
      </p>
      <p className="text-xs text-stone-500">{copy.caveat}</p>
    </div>
  )
}
