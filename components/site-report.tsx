import { SettlementSparkline } from "@/components/settlement-sparkline"
import type { MarsCave } from "@/lib/mars-caves"
import type { LandingPick, LandingSite } from "@/lib/mars-landing"
import { SETTLEMENT, settlementBrief } from "@/lib/settlement"
import { siteCopy } from "@/lib/site-copy"
import { evaluateSite } from "@/lib/site-physics"

export type SiteReportProps = {
  site?: LandingSite
  pick: LandingPick
  elevationM: number | null
  caves: MarsCave[]
}

const metres = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  if (Number.isInteger(rounded)) {
    return `${rounded}`
  }
  return rounded.toFixed(1)
}

const Figure = ({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) => {
  return (
    <div>
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd>
        <p className="font-mono text-stone-100">{value}</p>
        <p className="text-xs text-stone-400">{note}</p>
      </dd>
    </div>
  )
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

  const report = evaluateSite(
    elevationM,
    pick.lat_deg,
    pick.lon_east_deg,
    caves
  )
  const copy = siteCopy(report, site)
  const brief = settlementBrief(pick.lat_deg, pick.lon_east_deg, site)
  const buryM = Math.max(report.shieldingDepthM, report.thermal.annualSkinM)
  const windShare = Math.round(SETTLEMENT.wind.shareStrongTowardNE * 100)
  const weatherLabel =
    brief.weatherBound === "this-pin"
      ? "This pin is the weather series."
      : "Weather is the Jezero-band series."

  return (
    <div className="mt-2 space-y-3 text-sm text-stone-300" aria-live="polite">
      <div className="space-y-1">
        <p className="text-base font-medium text-stone-100">{copy.headline}</p>
        <p>{copy.detail}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Figure
          label="Radiation"
          value={`${metres(report.shieldingDepthM)} m cover`}
          note={`${report.surfaceDoseMsvPerSol.toFixed(2)} mSv/sol at the surface`}
        />
        <Figure
          label="Quake"
          value={report.seismic.tier}
          note={`${Math.round(report.seismic.distanceKm).toLocaleString("en-US")} km from Cerberus`}
        />
        <Figure
          label="Wind"
          value={`${report.wind.peakPa.toFixed(1)} Pa peak`}
          note={`${windShare}% of strong winds blow NE. Doors face SW.`}
        />
        <Figure
          label="Thermal"
          value={`${metres(report.thermal.annualSkinM)} m skin`}
          note={`Mean ${report.thermal.meanTempC.toFixed(0)} °C. Bury ${metres(buryM)} m.`}
        />
      </dl>

      <div>
        <p className="text-xs text-stone-400">
          Storm sols {SETTLEMENT.storm.startSol}–{SETTLEMENT.storm.endSol}
        </p>
        <SettlementSparkline />
        <p className="mt-1">{brief.stormNote}</p>
        <p className="mt-1 text-xs text-stone-400">{weatherLabel}</p>
      </div>

      <div>
        <p className="text-xs text-stone-400">Dig</p>
        <p>{brief.digNote}</p>
      </div>

      <div>
        <p className="text-xs text-stone-400">Water</p>
        <p>{brief.waterNote}</p>
      </div>

      <p className="text-[11px] text-stone-500">{brief.honesty}</p>
    </div>
  )
}
