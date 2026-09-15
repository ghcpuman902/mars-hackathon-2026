const COLS = 1440
const ROWS = 720

export type MolaGrid = {
  cols: number
  rows: number
  elev: Float32Array
}

export const loadMola4ppd = async (): Promise<MolaGrid> => {
  const response = await fetch("/data/mola_4ppd.i16")
  if (!response.ok) {
    throw new Error("MOLA heightmap missing")
  }
  const buffer = await response.arrayBuffer()
  const view = new DataView(buffer)
  const count = buffer.byteLength / 2
  const elev = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const raw = view.getInt16(i * 2, false)
    elev[i] = raw === -32768 ? 0 : raw
  }
  return { cols: COLS, rows: ROWS, elev }
}

export const sampleMolaMetres = (
  grid: MolaGrid,
  latDeg: number,
  lonEastDeg: number,
) => {
  const east = ((lonEastDeg % 360) + 360) % 360
  const col = Math.min(
    grid.cols - 1,
    Math.max(0, Math.round((east / 360) * grid.cols)),
  )
  const row = Math.min(
    grid.rows - 1,
    Math.max(0, Math.round(((90 - latDeg) / 180) * grid.rows)),
  )
  return grid.elev[row * grid.cols + col] ?? 0
}
