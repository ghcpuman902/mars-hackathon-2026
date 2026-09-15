import { SETTLEMENT, sparklineLabel } from "@/lib/settlement"

const WIDTH = 280
const HEIGHT = 44

export const SettlementSparkline = () => {
  const { series, storm } = SETTLEMENT
  const values = series.solar
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const lastSol = series.sols[series.sols.length - 1] ?? 729

  const path = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * WIDTH
      const y = HEIGHT - ((value - min) / span) * (HEIGHT - 6) - 3
      const command = index === 0 ? "M" : "L"
      return `${command}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const stormX = (storm.startSol / lastSol) * WIDTH
  const stormW = ((storm.endSol - storm.startSol) / lastSol) * WIDTH

  return (
    <svg
      role="img"
      aria-label={sparklineLabel()}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mt-2 h-11 w-full text-orange-400"
    >
      <rect
        x={stormX.toFixed(1)}
        y="0"
        width={stormW.toFixed(1)}
        height={HEIGHT}
        className="fill-red-500/20"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
