"use client"

import { animate, stagger, svg, utils, type JSAnimation } from "animejs"
import * as React from "react"

import { ChartButton, ChartCard, CalendarSolidIcon, ChevronDownIcon, DotsHorizontalIcon, InsightIcon, ChartLegendDot, ChartMenu, ChartMenuContent, ChartMenuItem, ChartMenuRadioGroup, ChartMenuRadioItem, ChartMenuTrigger, ChartTooltipLines, cn } from "./chart-primitives"
import { releaseStyles, useChartEntrance, useCountUp, useIsomorphicLayoutEffect, useReducedMotion } from "./chart-hooks"
import { useChartSize } from "./chart-size"
import { useControllableState } from "./chart-state"
import { formatPercentValue as formatPercent, formatTime } from "./chart-format"
import { areaPath, fittedDash, linePath, reachAt, valueAt, xAtLength } from "./chart-series"
import './chart-theme.css' 

/** A margin reading: when it was taken and the margin. */
type ProfitMarginPoint = {
  /** An ISO date-time ("2026-06-17T13:05:00Z"); a date alone ("2026-06-17") is midnight UTC. */
  time: string
  /** The margin in percent (64.2 is 64.20%). */
  value: number
}

/** A period of the menu: its time axis and both margins over it, oldest first. */
type ProfitMarginPeriod = {
  value: string
  label: string
  /** The x axis runs from `start` to `end` (ISO date-times); each line ends at its latest reading. */
  start: string
  end: string
  gross: ProfitMarginPoint[]
  net: ProfitMarginPoint[]
  /** The line in the insights box; without one there is no box. */
  insight?: string
}

type ProfitMarginSeries = "gross" | "net"

type ProfitMarginAnalysisChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  title?: string
  /** The soft line under the title. */
  description?: string
  /** The period menu's periods; one period shows no menu. */
  periods?: ProfitMarginPeriod[]
  /** The shown period (a `value` from `periods`). */
  period?: string
  /** Figma's Weekly with the sample, your first period otherwise. */
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  /** The selected reading (a `time` from the data; the other line shows its reading nearest to it), or null for the latest. */
  time?: string | null
  defaultTime?: string | null
  onTimeChange?: (time: string | null) => void
  /** The rows' names, beside their margins. */
  grossLabel?: string
  netLabel?: string
  /** The legend's names. */
  grossLegendLabel?: string
  netLegendLabel?: string
  /** The bold lead-in of the insights box. */
  insightLabel?: string
  /** Text for a reading's time in the tooltip and for screen readers ("Wed 1:05 PM" in a week). */
  formatTime?: (time: string, period: ProfitMarginPeriod) => string
  /** Called by the ⋯ button. */
  onMoreClick?: () => void
  locale?: string
}

type Point = { x: number; y: number }
type Plotted = Point & { time: number; value: number }

// Figma geometry ("Profit Margin Analysis Chart" 1473:80063)
const ROW_WIDTH = 683
const ROW_HEIGHT = 120
const LINE_TOP = 32 // a line's highest reading sits 32px under its row's top…
const LINE_BAND = 57 // …and its lowest 57px under that (31px above the row's bottom)
const GRID_COLUMNS = 11 // the rows' vertical grid: 12 lines, the outer ones solid
const LABEL_INSET = 106 // the row's name and margin start 106px before its right edge…
const LABEL_TOP = 40 // …40px down
const CURSOR_WIDTH = 2
const DOT_RADIUS = 8 // the 16px dot: white inside a 2.375px ring in the line's colour
const DOT_RING = 2.375
const AREA_OPACITY = 0.25
const GRID = "stroke-[#e0e0e0]" // Figma's grid lines are a raw #e0e0e0
const VERTICAL_DASH = fittedDash(ROW_HEIGHT, 4, 4)
const TIP_GAP = 14 // the tooltip sits 14px right of the cursor (left of it before the row's name)
const TIP_PADDING_X = 24 // its 8px left and 16px right padding
const TIP_PADDING_Y = 16 // and 8px top and bottom
const DRAW_AT = 450
const DRAW_DURATION = 1500
const ROW_STAGGER = 180
const RIDE = 450
const MORPH = 800
const RING = "focus-visible:ring-primary-purple-500/40" // the card's focus rings are purple, like its first line
const SERIES: ProfitMarginSeries[] = ["gross", "net"]

/** Each line's colours: the 50 step behind its readings, the 500 step for the line, its area, the cursor and the dot. */
const tones: Record<ProfitMarginSeries, { tint: string; stroke: string; fill: string; dot: string }> = {
  gross: {
    tint: "fill-primary-purple-50",
    stroke: "stroke-primary-purple-500",
    fill: "fill-primary-purple-500",
    dot: "bg-primary-purple-500 [--dot-ring:var(--primary-purple-500)]",
  },
  net: {
    tint: "fill-primary-blue-50",
    stroke: "stroke-primary-blue-500",
    fill: "fill-primary-blue-500",
    dot: "bg-primary-blue-500 [--dot-ring:var(--primary-blue-500)]",
  },
}

const MINUTE = 60_000
const DAY = 86_400_000

/** A reading per [minutes after `start`, margin], `start` an ISO date (midnight UTC). */
function minutesFrom(start: string, readings: [number, number][]): ProfitMarginPoint[] {
  const from = Date.parse(`${start}T00:00:00Z`)
  return readings.map(([minutes, value]) => ({ time: new Date(from + minutes * MINUTE).toISOString(), value }))
}

/** A reading per value, `every` days apart from `start` (an ISO date, midnight UTC). */
function everyDays(start: string, values: number[], every = 1): ProfitMarginPoint[] {
  const from = Date.parse(`${start}T00:00:00Z`)
  return values.map((value, i) => ({ time: new Date(from + i * every * DAY).toISOString(), value }))
}

// The Figma week, 15 to 21 June 2026: each line's vertices read back through its row's scale (its highest reading 32px
// down, its lowest 89px: 0.1 points a pixel), Figma's hand-drawn last stretch sampled along its curve. Gross margin is
// read up to Saturday 2:11 AM and net margin, which waits for the period's costs, up to Wednesday 1:05 PM: their last
// readings, Figma's 64.20% and 18.50%, sit on the drawn cursors (8 and 4 of the 11 grid columns in).
const WEEK_GROSS: [number, number][] = [
  [7, 62.37], [109, 63.1], [232, 62.74], [521, 64.57], [629, 63.84], [839, 64.57], [1158, 64.23], [1613, 66.06], [2322, 62.71],
  [2532, 63.42], [2626, 63.21], [2706, 63.63], [3111, 63.42], [3299, 62.53], [3429, 62.95], [3487, 64.46], [3740, 61.59],
  [3986, 64.33], [4051, 63.73], [4398, 67], [4644, 65.48], [4919, 65.93], [5122, 65.09], [5259, 66.66], [5650, 63.81],
  [5794, 64.46], [5910, 63.23], [6134, 66.45], [6214, 65.61], [6467, 64.65], [6655, 62.03], [6691, 62.63], [6814, 61.3],
  [6882, 61.69], [6946, 62.05], [7008, 62.4], [7069, 62.73], [7130, 63.05], [7192, 63.4], [7257, 63.76], [7331, 64.2],
]
const WEEK_NET: [number, number][] = [
  [12, 20.45], [46, 20.06], [78, 19.7], [110, 19.35], [140, 19.02], [170, 18.7], [201, 18.35], [233, 17.99], [267, 17.6],
  [328, 18.93], [346, 18.33], [440, 20.95], [566, 21.91], [606, 22.75], [718, 19.53], [775, 20.76], [847, 20.11], [1042, 22.96],
  [1111, 21.39], [1212, 22.23], [1349, 21.78], [1471, 23.3], [1644, 20.03], [1677, 20.63], [1799, 17.89], [1926, 20.76],
  [1954, 19.25], [2019, 18.83], [2113, 19.72], [2315, 19.93], [2355, 19.51], [2402, 19.72], [2506, 19.01], [2860, 22.36],
  [3087, 20.53], [3245, 20.87], [3350, 20.14], [3404, 20.87], [3548, 19.04], [3610, 19.4], [3665, 18.5],
]

// Sample periods for the menu: June by day (gross to the 20th, net to the 17th) and 2026 by week.
const MONTH_GROSS = [
  62.83, 63.05, 62.99, 63.07, 62.41, 62.22, 62.19, 61.98, 62.08, 62.08, 62.47, 62.86, 63.21, 63.42, 63.45, 63.84, 63.65, 64.15,
  63.99, 64.08,
]
const MONTH_NET = [19.51, 19.49, 19.23, 19.17, 19.36, 19.04, 18.6, 18.35, 17.97, 17.88, 18.34, 18.81, 18.96, 19.2, 19.47, 19.4, 19.3]
const YEAR_GROSS = [
  61.43, 62.14, 61.92, 62.06, 62.13, 62.39, 62.4, 62.15, 62.59, 62.9, 62.85, 62.85, 63.32, 62.82, 63.05, 63.6, 63.29, 63.41,
  63.06, 63.33, 63.33, 63.35, 64.03, 63.94,
]
const YEAR_NET = [
  17.03, 17.47, 17.43, 17.51, 17.4, 17.93, 17.82, 17.77, 17.85, 18.24, 18.36, 18.12, 18.2, 18.34, 18.16, 18.58, 18.44, 18.49,
  18.85, 18.6, 18.58, 18.63, 18.86,
]

const sampleProfitMarginPeriods: ProfitMarginPeriod[] = [
  {
    value: "weekly",
    label: "Weekly",
    start: "2026-06-15T00:00:00Z",
    end: "2026-06-22T00:00:00Z",
    gross: minutesFrom("2026-06-15", WEEK_GROSS),
    net: minutesFrom("2026-06-15", WEEK_NET),
    insight: "Lower supplier costs pushed Gross Margin to 64.20%.",
  },
  {
    value: "monthly",
    label: "Monthly",
    start: "2026-06-01T00:00:00Z",
    end: "2026-07-01T00:00:00Z",
    gross: everyDays("2026-06-01", MONTH_GROSS),
    net: everyDays("2026-06-01", MONTH_NET),
    insight: "Net Margin recovered to 19.30% after the mid-month promo.",
  },
  {
    value: "yearly",
    label: "Yearly",
    start: "2026-01-01T00:00:00Z",
    end: "2027-01-01T00:00:00Z",
    gross: everyDays("2026-01-05", YEAR_GROSS, 7),
    net: everyDays("2026-01-05", YEAR_NET, 7),
    insight: "Gross Margin has gained 2.51 points since January.",
  },
]
const SAMPLE_PERIOD = "weekly"

const round = (n: number) => Math.round(n * 1000) / 1000
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)
const parseTime = (time: string) => Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(time) ? `${time}T00:00:00Z` : time)

/**
 * A line's readings in its row: time across the period, the margin scaled to the row (its highest reading 32px down,
 * its lowest 89px, a flat line in the middle), oldest first.
 */
function layoutLine(points: ProfitMarginPoint[], start: number, end: number, width: number): Plotted[] {
  const readings = points
    .map((p) => ({ time: parseTime(p.time), value: p.value }))
    .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value))
    .sort((a, b) => a.time - b.time)
  if (!readings.length) return []
  const values = readings.map((p) => p.value)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = end - start
  return readings.map((p) => ({
    ...p,
    x: span > 0 ? ((p.time - start) / span) * width : 0,
    y: hi > lo ? LINE_TOP + ((hi - p.value) / (hi - lo)) * LINE_BAND : LINE_TOP + LINE_BAND / 2,
  }))
}

/** The reading nearest to `time`, or the latest for null. */
function nearest(line: Plotted[], time: number | null) {
  if (!line.length) return -1
  if (time === null) return line.length - 1
  let best = 0
  for (let i = 1; i < line.length; i++) if (Math.abs(line[i].time - time) < Math.abs(line[best].time - time)) best = i
  return best
}

/** The margin along a line at x (linear between readings, clamped at the ends). */
function valueAlong(line: Plotted[], x: number) {
  return valueAt(
    line.map((p) => ({ x: p.x, y: p.value })),
    x,
  )
}

/**
 * Two lines resampled at the same shares of their own x ranges (every vertex of both, plus `extra` evenly spaced
 * ones), so a morph between lines of other lengths can move the points along x as well as y: at 0 it is exactly the
 * first line, at 1 exactly the second.
 */
function alignByShare(from: Point[], to: Point[], extra = 32) {
  const range = (line: Point[]) => [line[0].x, line[line.length - 1].x] as const
  const shares = new Set<number>()
  for (const line of [from, to]) {
    const [a, b] = range(line)
    for (const p of line) shares.add(b > a ? (p.x - a) / (b - a) : 0)
  }
  for (let i = 0; i <= extra; i++) shares.add(i / extra)
  const sorted = [...shares].sort((a, b) => a - b)
  const at = (line: Point[], share: number) => {
    const [a, b] = range(line)
    const x = a + (b - a) * share
    return { x, y: valueAt(line, x) }
  }
  return { from: sorted.map((s) => at(from, s)), to: sorted.map((s) => at(to, s)) }
}

/** The share of a line's x range where x sits (0 at its first reading, 1 at its last). */
function shareOf(line: Point[], x: number) {
  if (line.length < 2) return 1
  const a = line[0].x
  const b = line[line.length - 1].x
  return b > a ? clamp((x - a) / (b - a), 0, 1) : 1
}

/** The dot's ring: a filled ring path (Chrome draws thin strokes as shifted hairlines; a filled ring is exact). */
function ringPath(cx: number, cy: number) {
  const [r, s] = [DOT_RADIUS, DOT_RADIUS - DOT_RING]
  const ring = (radius: number, sweep: 0 | 1) =>
    `M ${round(cx)} ${round(cy - radius)} A ${radius} ${radius} 0 1 ${sweep} ${round(cx)} ${round(cy + radius)} A ${radius} ${radius} 0 1 ${sweep} ${round(cx)} ${round(cy - radius)} Z`
  return `${ring(r, 1)} ${ring(s, 0)}`
}

/** A row's name and its margin at the cursor (counting to new values). */
function RowLabel({ series, label, value, format, left }: { series: ProfitMarginSeries; label: string; value: number | undefined; format: (n: number) => string; left: number }) {
  const valueRef = React.useRef<HTMLParagraphElement>(null)
  useCountUp(valueRef, value ?? 0, format, { enabled: value !== undefined, duration: 450 })
  return (
    <div data-slot="profit-margin-analysis-chart-label" data-series={series} className="pointer-events-none absolute flex flex-col items-start gap-2" style={{ left, top: LABEL_TOP }}>
      <p className="typo-label-03-medium hug-w whitespace-nowrap text-fg-soft">{label}</p>
      <p ref={valueRef} data-slot="profit-margin-analysis-chart-value" data-series={series} className="typo-label-04-semibold hug-w whitespace-nowrap text-fg-loud">
        {value !== undefined ? format(value) : "–"}
      </p>
    </div>
  )
}

/**
 * "Profit Margin Analysis Chart" from the Keitoto library: gross and net profit margin over the period, a row each. A
 * row's line runs from the period's start to its latest reading, where a cursor in its colour stands with a ringed dot
 * on the line, the stretch before it tinted, over a dashed grid, with the margin at the cursor beside it; an insight
 * closes the card. Hover (or drag on touch) moves both cursors to a time and a tooltip names it, a click or the arrow
 * keys keep it; the period menu shows the week, the month by day or the year by week, and the legend brings a line
 * forward. Animated with anime.js: the legend and the grid come in, both lines draw themselves with their tints and
 * areas filling in behind the tips and their margins counting along, then the cursors grow and the dots pop; the
 * cursors and dots ride along the lines to a new time, and a new period morphs the lines while the margins count.
 */
function ProfitMarginAnalysisChart({
  title = "Profit Margin Analysis",
  description = "Comparison of Gross vs Net Profit Margin",
  periods = sampleProfitMarginPeriods,
  period: periodProp,
  defaultPeriod,
  onPeriodChange,
  time: timeProp,
  defaultTime,
  onTimeChange,
  grossLabel = "Gross Margin",
  netLabel = "Net Margin",
  grossLegendLabel = "Gross Profit Margin",
  netLegendLabel = "Net Profit Margin",
  insightLabel = "Insights:",
  formatTime: formatTimeProp,
  onMoreClick,
  locale = "en-US",
  className,
  ...props
}: ProfitMarginAnalysisChartProps) {
  const [periodValue, setPeriod] = useControllableState({
    value: periodProp,
    // the sample opens on Figma's week, your periods on the first one
    defaultValue: defaultPeriod ?? (periods === sampleProfitMarginPeriods ? SAMPLE_PERIOD : (periods[0]?.value ?? "")),
    onChange: onPeriodChange,
  })
  const period = periods.find((p) => p.value === periodValue) ?? periods[0]
  const [selectedTime, setSelectedTime] = useControllableState<string | null>({ value: timeProp, defaultValue: defaultTime ?? null, onChange: onTimeChange })

  const [rowRef, row] = useChartSize<HTMLDivElement>({ width: ROW_WIDTH, height: ROW_HEIGHT })
  const width = row.width || ROW_WIDTH
  const start = period ? parseTime(period.start) : 0
  const end = period ? parseTime(period.end) : 0
  const lines = React.useMemo(
    () => ({
      gross: period ? layoutLine(period.gross, start, end, width) : [],
      net: period ? layoutLine(period.net, start, end, width) : [],
    }),
    [period, start, end, width],
  )
  // Content keys: parents may pass new arrays on every render, so changes are detected by value.
  const shapeKey = SERIES.map((s) => lines[s].map((p) => `${round(p.x)},${round(p.y)}`).join(";")).join("|")

  const [hoveredTime, setHoveredTime] = React.useState<number | null>(null)
  const [tipSeries, setTipSeries] = React.useState<ProfitMarginSeries | null>(null)
  const [emphasis, setEmphasis] = React.useState<ProfitMarginSeries | null>(null)
  const selected = selectedTime !== null ? parseTime(selectedTime) : null
  const activeTime = hoveredTime ?? (selected !== null && Number.isFinite(selected) ? selected : null)
  const active = { gross: nearest(lines.gross, activeTime), net: nearest(lines.net, activeTime) }
  const activePoint = (s: ProfitMarginSeries) => lines[s][active[s]] as Plotted | undefined

  const percent = React.useCallback((value: number) => formatPercent(value, { locale, minimumFractionDigits: 2, maximumFractionDigits: 2 }), [locale])
  const timeText = (time: number) => {
    if (!period) return ""
    if (formatTimeProp) return formatTimeProp(new Date(time).toISOString(), period)
    const span = end - start
    const options: Intl.DateTimeFormatOptions =
      span <= 2 * DAY
        ? { hour: "numeric", minute: "2-digit" }
        : span <= 8 * DAY
          ? { weekday: "short", hour: "numeric", minute: "2-digit" }
          : span <= 62 * DAY
            ? { weekday: "short", month: "short", day: "numeric" }
            : { month: "short", day: "numeric", year: "numeric" }
    return formatTime(time, options, locale)
  }
  const labels: Record<ProfitMarginSeries, string> = { gross: grossLabel, net: netLabel }

  // The tooltip sits beside the cursor of the row under the pointer (or the focused row), level with the dot: right of
  // it, or left of it when it would reach the row's name. Its size is measured on an invisible copy with the final text.
  const tipPoint = tipSeries ? activePoint(tipSeries) : undefined
  const tooltip = tipSeries && tipPoint ? { date: timeText(tipPoint.time), value: percent(tipPoint.value) } : undefined
  const [sizerRef, sizer] = useChartSize<HTMLSpanElement>({ width: 80, height: 38 })
  const tipWidth = sizer.width + TIP_PADDING_X
  const tipHeight = sizer.height + TIP_PADDING_Y
  const labelLeft = Math.max(0, width - LABEL_INSET)
  const tipFlipped = !!tipPoint && tipPoint.x + TIP_GAP + tipWidth > labelLeft - 8 && tipPoint.x - TIP_GAP - tipWidth >= 0
  const tipLeft = tipPoint ? Math.round(tipFlipped ? tipPoint.x - TIP_GAP - tipWidth : Math.min(tipPoint.x + TIP_GAP, Math.max(0, width - tipWidth))) : 0
  const tipTop = tipPoint ? Math.round(clamp(tipPoint.y - tipHeight / 2, 0, Math.max(0, ROW_HEIGHT - tipHeight))) : 0

  const reduced = useReducedMotion()
  const root = React.useRef<HTMLDivElement>(null)
  const insightRef = React.useRef<HTMLParagraphElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const ids = React.useId().replace(/[^\w-]/g, "")
  const all = <T extends Element = HTMLElement>(selector: string) => Array.from(root.current?.querySelectorAll<T>(selector) ?? [])
  const part = <T extends Element = SVGElement>(slot: string, s: ProfitMarginSeries) => root.current?.querySelector<T>(`[data-slot="profit-margin-analysis-chart-${slot}"][data-series="${s}"]`) ?? null
  // what the entrance's callbacks need at play time (the card may be resized before it scrolls into view)
  const latest = React.useRef({ lines, active, percent, width })
  useIsomorphicLayoutEffect(() => {
    latest.current = { lines, active, percent, width }
  })
  // set while the entrance draws, so the ride and the morph leave the lines to it
  const drawing = React.useRef(false)

  /** Puts a row's cursor, tint and dot at (x, y) of a line drawn at its final place (the ride and the morph move them). */
  const placeActive = (s: ProfitMarginSeries, x: number, y: number) => {
    const point = latest.current.lines[s][latest.current.active[s]]
    const cursor = part<SVGGElement>("cursor", s)
    const dot = part<SVGGElement>("dot", s)
    if (!point) return
    if (cursor) cursor.style.transform = `translateX(${round(x - point.x)}px)`
    if (dot) dot.style.transform = `translate(${round(x - point.x)}px, ${round(y - point.y)}px)`
    part("tint", s)?.setAttribute("width", String(Math.max(0, round(x))))
  }
  const settleActive = (s: ProfitMarginSeries) => {
    const point = latest.current.lines[s][latest.current.active[s]]
    part<SVGGElement>("cursor", s)?.style.removeProperty("transform")
    part<SVGGElement>("dot", s)?.style.removeProperty("transform")
    if (point) part("tint", s)?.setAttribute("width", String(Math.max(0, round(point.x))))
  }

  // Entrance, once the card is in view: the legend's dots pop and its names come in, the divider and the grid draw
  // across, both lines draw themselves left to right (net a little after gross) with their tints and areas filling in
  // behind the tips and their margins counting along the line, then each cursor grows and its dot pops as the tip
  // reaches it, and the insight slides in with its sparkle popping.
  useChartEntrance(root, (timeline) => {
    drawing.current = true
    const done: (() => void)[] = []
    timeline
      .add(all('[data-slot="profit-margin-analysis-chart-legend-dot"]'), { scale: { from: 0.4 }, opacity: { from: 0 }, duration: 600, ease: "outBack(2)", delay: stagger(90) }, 0)
      .add(all('[data-slot="profit-margin-analysis-chart-legend-label"]'), { opacity: { from: 0 }, translateX: { from: -4 }, duration: 600, ease: "outQuad", delay: stagger(90) }, 80)
      .add(all('[data-slot="profit-margin-analysis-chart-divider"]'), { scaleX: { from: 0 }, duration: 900, ease: "outExpo" }, 0)
      .add(all<SVGLineElement>('[data-slot="profit-margin-analysis-chart-rule"]'), { x2: { from: 0 }, duration: 900, ease: "outQuad", delay: stagger(60) }, 150)
      .add(all<SVGLineElement>('[data-slot="profit-margin-analysis-chart-column"]'), { y2: { from: 0 }, duration: 700, ease: "outQuad", delay: stagger(18) }, 200)
    SERIES.forEach((s, k) => {
      const line = part<SVGPathElement>("line", s)
      const wipe = part<SVGRectElement>("wipe", s)
      const tint = part<SVGRectElement>("tint", s)
      const value = part<HTMLParagraphElement>("value", s)
      const cursor = part<SVGGElement>("cursor-line", s)
      const dot = part<SVGGElement>("dot-pop", s)
      const points = latest.current.lines[s]
      const at = DRAW_AT + k * ROW_STAGGER
      if (!line || !points.length) return
      const drawn = { f: 0 }
      const paint = () => {
        const { lines: now, active: chosen, percent: format } = latest.current
        const current = now[s]
        const tip = drawn.f > 0 ? xAtLength(current, drawn.f) : 0
        const until = Math.min(tip, current[chosen[s]]?.x ?? tip)
        wipe?.setAttribute("width", String(round(Math.max(0, tip + 1))))
        tint?.setAttribute("width", String(round(Math.max(0, until))))
        if (value) value.textContent = format(valueAlong(current, until))
      }
      paint()
      timeline
        .add(svg.createDrawable(line), { draw: ["0 0", "0 1"], duration: DRAW_DURATION, ease: "inOutSine" }, at)
        .add(
          drawn,
          {
            f: [0, 1],
            duration: DRAW_DURATION,
            ease: "inOutSine",
            onUpdate: paint,
            // the whole row again, for longer lines to come
            onComplete: () => wipe?.setAttribute("width", String(round(latest.current.width + 2))),
          },
          at,
        )
      // the cursor and the dot come in when the tip reaches the selected reading (the latest by default)
      const point = points[latest.current.active[s]]
      const reach = point ? at + reachAt(points, point.x) * DRAW_DURATION : at + DRAW_DURATION
      if (cursor) timeline.add(cursor, { scaleY: { from: 0 }, duration: 600, ease: "outExpo" }, Math.max(at, reach - 120))
      if (dot) timeline.add(dot, { scale: { from: 0 }, duration: 550, ease: "outBack(2.4)" }, Math.max(at, reach - 60))
      done.push(() => {
        // createDrawable leaves its dash attributes (revert sets them to "hidden"): give the plain line back
        for (const attribute of ["pathLength", "stroke-dasharray", "stroke-dashoffset"]) line.removeAttribute(attribute)
        wipe?.setAttribute("width", String(round(latest.current.width + 2)))
        const { lines: now, active: chosen, percent: format } = latest.current
        const final = now[s][chosen[s]]
        if (final) tint?.setAttribute("width", String(round(Math.max(0, final.x))))
        if (value && final) value.textContent = format(final.value)
      })
    })
    const insightAt = DRAW_AT + ROW_STAGGER + DRAW_DURATION * 0.75
    timeline
      .add(all('[data-slot="profit-margin-analysis-chart-insight"]'), { opacity: { from: 0 }, translateY: { from: 10 }, duration: 700, ease: "outExpo" }, insightAt)
      .add(all('[data-slot="profit-margin-analysis-chart-insight-icon"]'), { scale: { from: 0 }, rotate: { from: -90 }, duration: 800, ease: "outBack(2.2)" }, insightAt + 120)
      .call(() => (drawing.current = false), DRAW_AT + ROW_STAGGER + DRAW_DURATION)
    return () => {
      drawing.current = false
      done.forEach((finish) => finish())
    }
  })

  // A new time sends each cursor and dot riding along its line to the new reading, the tint following (during a morph
  // the morph moves them, and its end puts them at the reading then active).
  const drawnAt = React.useRef<Record<ProfitMarginSeries, number | null>>({ gross: activePoint("gross")?.x ?? null, net: activePoint("net")?.x ?? null })
  const rides = React.useRef<Record<ProfitMarginSeries, JSAnimation | null>>({ gross: null, net: null })
  const morph = React.useRef<JSAnimation | null>(null)
  const lastActive = React.useRef({ shapeKey, width, gross: active.gross, net: active.net })
  useIsomorphicLayoutEffect(() => {
    const before = lastActive.current
    lastActive.current = { shapeKey, width, gross: active.gross, net: active.net }
    for (const s of SERIES) {
      const point = activePoint(s)
      const from = drawnAt.current[s]
      if (!point) continue
      // nothing moved (the first render too: the entrance has set its first frame)
      if (before[s] === active[s] && before.shapeKey === shapeKey && before.width === width && from === point.x) continue
      // new lines or a resize: the morph (or its redraw) places them; during a morph its end does
      if (before.shapeKey !== shapeKey || before.width !== width || morph.current) continue
      rides.current[s]?.cancel()
      if (reduced || drawing.current || from === null) {
        // while the entrance draws, it puts the tint where the tip and the new reading allow
        drawnAt.current[s] = point.x
        if (!drawing.current) settleActive(s)
        continue
      }
      const line = lines[s]
      const state = { x: from }
      const paint = () => {
        drawnAt.current[s] = state.x
        placeActive(s, state.x, valueAt(line, state.x))
      }
      paint()
      rides.current[s] = animate(state, {
        x: point.x,
        duration: RIDE,
        ease: "outExpo",
        onUpdate: paint,
        onComplete: () => {
          drawnAt.current[s] = point.x
          settleActive(s)
        },
      })
    }
  }, [active.gross, active.net, shapeKey, width, reduced])

  // A new period (or new data) morphs each line and its area from the shape on screen, the points moving along x as
  // well (the lines' lengths change), and its cursor, tint and dot ride along to the new reading. A resize redraws.
  const shown = React.useRef<Record<ProfitMarginSeries, Point[]>>({ gross: lines.gross, net: lines.net })
  const lastShape = React.useRef({ shapeKey, width })
  useIsomorphicLayoutEffect(() => {
    const before = lastShape.current
    lastShape.current = { shapeKey, width }
    const finish = () => {
      for (const s of SERIES) {
        shown.current[s] = lines[s]
        drawnAt.current[s] = activePoint(s)?.x ?? null
      }
    }
    if (before.shapeKey === shapeKey) {
      if (!morph.current) finish()
      return
    }
    morph.current?.cancel()
    morph.current = null
    for (const s of SERIES) rides.current[s]?.cancel()
    if (reduced || drawing.current || before.width !== width) {
      finish()
      // (while the entrance draws, it keeps placing the tint itself)
      if (!drawing.current) for (const s of SERIES) settleActive(s)
      return
    }
    const plan = SERIES.map((s) => {
      const from = shown.current[s]
      const to = lines[s]
      if (!from.length || !to.length) return null
      const toPoint = to[clamp(active[s], 0, to.length - 1)]
      // from where the cursor is drawn (mid-ride too) to the new reading
      return { s, pair: alignByShare(from, to), fromShare: shareOf(from, drawnAt.current[s] ?? from[from.length - 1].x), toShare: shareOf(to, toPoint.x) }
    })
    const draw = (t: number) => {
      for (const step of plan) {
        if (!step) continue
        const { s, pair, fromShare, toShare } = step
        const frame = pair.from.map((p, i) => ({ x: p.x + (pair.to[i].x - p.x) * t, y: p.y + (pair.to[i].y - p.y) * t }))
        part("line", s)?.setAttribute("d", linePath(frame))
        part("area", s)?.setAttribute("d", areaPath(frame, ROW_HEIGHT))
        const share = fromShare + (toShare - fromShare) * t
        const x = frame[0].x + (frame[frame.length - 1].x - frame[0].x) * share
        placeActive(s, x, valueAt(frame, x))
      }
    }
    const state = { t: 0 }
    draw(0)
    morph.current = animate(state, {
      t: 1,
      duration: MORPH,
      ease: "outExpo",
      onUpdate: () => draw(state.t),
      onComplete: () => {
        // the latest layout: the card may have been resized while the lines moved
        morph.current = null
        for (const s of SERIES) {
          const line = latest.current.lines[s]
          part("line", s)?.setAttribute("d", linePath(line))
          part("area", s)?.setAttribute("d", areaPath(line, ROW_HEIGHT))
          settleActive(s)
        }
        finish()
      },
    })
    // a line that wasn't there fades in
    for (const s of SERIES) {
      const marks = part("marks", s)
      if (marks && !shown.current[s].length && lines[s].length) animate(marks, { opacity: [0, 1], duration: 500, ease: "outQuad", onComplete: releaseStyles("opacity") })
    }
  }, [shapeKey, width, reduced])
  React.useEffect(
    () => () => {
      morph.current?.cancel()
      rides.current.gross?.cancel()
      rides.current.net?.cancel()
    },
    [],
  )

  // The tooltip pops in, slides along with the cursor and moves between rows; a new insight fades over the old one.
  const lastTip = React.useRef<{ series: ProfitMarginSeries; left: number; top: number } | null>(null)
  useIsomorphicLayoutEffect(() => {
    const before = lastTip.current
    lastTip.current = tipSeries && tooltip ? { series: tipSeries, left: tipLeft, top: tipTop } : null
    const tip = tipRef.current
    if (!tip || !tipSeries || !tooltip || reduced) return
    if (!before || before.series !== tipSeries) {
      animate(tip, { opacity: [0, 1], scale: [0.94, 1], duration: 260, ease: "outQuad", onComplete: releaseStyles("opacity", "transform") })
      return
    }
    if (before.left !== tipLeft || before.top !== tipTop)
      animate(tip, {
        translateX: [before.left - tipLeft + Number(utils.get(tip, "translateX", false) || 0), 0],
        translateY: [before.top - tipTop + Number(utils.get(tip, "translateY", false) || 0), 0],
        duration: RIDE,
        ease: "outExpo",
        onComplete: releaseStyles("transform"),
      })
  }, [tipSeries, tipLeft, tipTop, reduced])
  const insight = period?.insight
  const lastInsight = React.useRef(insight)
  useIsomorphicLayoutEffect(() => {
    const before = lastInsight.current
    lastInsight.current = insight
    if (before === insight || reduced || !insightRef.current) return
    animate(insightRef.current, { opacity: [0, 1], translateY: [3, 0], duration: 400, ease: "outQuad", onComplete: releaseStyles("opacity", "transform") })
  }, [insight, reduced])

  const changePeriod = (next: string) => {
    setHoveredTime(null)
    setTipSeries(null)
    setPeriod(next)
    // a new period opens on its latest readings
    if (timeProp === undefined) setSelectedTime(null)
  }
  const localX = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.currentTarget
    const box = target.getBoundingClientRect()
    // CSS zoom (the live demo scales wide demos down) scales the box but not the layout
    const zoom = box.width / (target.offsetWidth || box.width || 1) || 1
    return (event.clientX - box.left) / zoom
  }
  /** The time under the pointer, snapped to the row's nearest reading so both rows agree on it. */
  const timeAt = (s: ProfitMarginSeries, event: React.PointerEvent<HTMLElement>) => {
    const line = lines[s]
    const x = localX(event)
    const raw = width > 0 ? start + (clamp(x, 0, width) / width) * (end - start) : start
    const i = nearest(line, raw)
    return i >= 0 ? line[i].time : null
  }
  const onKeyDown = (s: ProfitMarginSeries, event: React.KeyboardEvent<HTMLDivElement>) => {
    const line = lines[s]
    const n = line.length
    if (!n) return
    const current = active[s]
    const page = Math.max(1, Math.round(n / 10))
    const next = { ArrowRight: current + 1, ArrowUp: current + 1, ArrowLeft: current - 1, ArrowDown: current - 1, PageUp: current + page, PageDown: current - page, Home: 0, End: n - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setHoveredTime(null)
    setTipSeries(s)
    const index = clamp(next, 0, n - 1)
    setSelectedTime(index === n - 1 && event.key === "End" ? null : new Date(line[index].time).toISOString())
  }

  const describe = (s: ProfitMarginSeries) => {
    const point = activePoint(s)
    return point ? `${timeText(point.time)}: ${percent(point.value)}` : undefined
  }
  const legend: { s: ProfitMarginSeries; label: string }[] = [
    { s: "gross", label: grossLegendLabel },
    { s: "net", label: netLegendLabel },
  ]
  const horizontalDash = fittedDash(width, 4, 4)
  const columns = Array.from({ length: GRID_COLUMNS + 1 }, (_, i) => (i * width) / GRID_COLUMNS)

  return (
    <ChartCard ref={root} role="group" aria-label={title} className={cn("w-full", className)} {...props}>
      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* the padding keeps the descenders out of truncate's clip (the text styles have a line height of 1) */}
          <p className="typo-heading-01-semibold -my-0.5 truncate py-0.5 text-fg-loud">{title}</p>
          {description && <p className="typo-label-02-medium -my-0.5 truncate py-0.5 text-fg-soft">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {periods.length > 1 && period && (
            <ChartMenu>
              <ChartMenuTrigger {...{ asChild: true }}>
                <ChartButton corner="rounded" aria-label={`Period: ${period.label}`} className={cn("group/trigger text-fg-normal", RING)}>
                  <CalendarSolidIcon />
                  {period.label}
                  <ChevronDownIcon className="transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
                </ChartButton>
              </ChartMenuTrigger>
              <ChartMenuContent>
                <ChartMenuRadioGroup value={period.value} onValueChange={changePeriod}>
                  {periods.map((p) => (
                    <ChartMenuRadioItem key={p.value} value={p.value}>
                      {p.label}
                    </ChartMenuRadioItem>
                  ))}
                </ChartMenuRadioGroup>
              </ChartMenuContent>
            </ChartMenu>
          )}
          <ChartMenu>
            <ChartMenuTrigger asChild>
              <ChartButton size="icon" corner="rounded" aria-label="Altre opzioni" className={RING}>
                <DotsHorizontalIcon />
              </ChartButton>
            </ChartMenuTrigger>
            <ChartMenuContent align="end">
              <ChartMenuItem onSelect={() => onMoreClick?.()}>Esporta dati CSV</ChartMenuItem>
            </ChartMenuContent>
          </ChartMenu>
        </div>
      </div>

      {/* Figma "Divider": a 1px #e9e9e9 line over [85, 86], the pixel above its place in the 24px gaps */}
      <div aria-hidden data-slot="profit-margin-analysis-chart-divider" className="-mt-px h-px shrink-0 origin-left bg-[#e9e9e9]" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {legend.map(({ s, label }) => (
          // hovering a legend item brings its line forward
          <span key={s} className="flex min-w-0 items-center gap-2" onPointerEnter={() => setEmphasis(s)} onPointerLeave={() => setEmphasis(null)}>
            <span data-slot="profit-margin-analysis-chart-legend-dot" className="flex shrink-0">
              <ChartLegendDot size={12} className={tones[s].dot} />
            </span>
            <span data-slot="profit-margin-analysis-chart-legend-label" className="typo-label-02-medium hug-w -my-0.5 truncate py-0.5 text-fg-soft">
              {label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {SERIES.map((s, k) => {
          const line = lines[s]
          const point = activePoint(s)
          const tone = tones[s]
          const d = linePath(line)
          return (
            <div key={s} ref={k === 0 ? rowRef : undefined} data-slot="profit-margin-analysis-chart-row" data-series={s} className="relative" style={{ height: ROW_HEIGHT }}>
              <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
                <defs>
                  <clipPath id={`${ids}-${s}-wipe`}>
                    <rect data-slot="profit-margin-analysis-chart-wipe" data-series={s} x={-1} y={-2} width={width + 2} height={ROW_HEIGHT + 4} />
                  </clipPath>
                  {/* Figma's drop shadow under the dot: black at 10%, 0.79px down, blur 0.79 */}
                  <filter id={`${ids}-${s}-dot`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                    <feDropShadow dx="0" dy="0.792" stdDeviation="0.356" floodColor="#000" floodOpacity="0.1" />
                  </filter>
                </defs>
                <g data-slot="profit-margin-analysis-chart-shade" data-series={s} className={cn("transition-opacity duration-300 motion-reduce:transition-none", emphasis && emphasis !== s && "opacity-35")}>
                  {/* the stretch up to the cursor in the line's 50 step (Figma "Rectangle 5042"), under the grid */}
                  <rect data-slot="profit-margin-analysis-chart-tint" data-series={s} x={0} y={0} width={Math.max(0, point?.x ?? 0)} height={ROW_HEIGHT} className={tone.tint} />
                </g>
                {/* Figma "Divider" (Border/Soft) along the top and the bottom, the dashed "Grid Line" across the middle
                    (4/4, fitted, square ends), all centred on their y */}
                <line data-slot="profit-margin-analysis-chart-rule" x1={0} x2={width} y1={0} y2={0} strokeLinecap="round" className="stroke-border-soft" />
                <line data-slot="profit-margin-analysis-chart-rule" x1={0} x2={width} y1={ROW_HEIGHT / 2} y2={ROW_HEIGHT / 2} className={GRID} {...horizontalDash} />
                <line data-slot="profit-margin-analysis-chart-rule" x1={0} x2={width} y1={ROW_HEIGHT} y2={ROW_HEIGHT} strokeLinecap="round" className="stroke-border-soft" />
                {/* the vertical grid: 12 lines, the outer ones solid, the others dashed 4/4 with round ends; the cursor
                    takes the place of a line it sits on, as in Figma */}
                {columns.map((x, i) => (
                  <line
                    key={i}
                    data-slot="profit-margin-analysis-chart-column"
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={ROW_HEIGHT}
                    strokeLinecap="round"
                    className={cn(GRID, "transition-opacity duration-200", point && Math.abs(x - point.x) < 1.5 && "opacity-0")}
                    {...(i === 0 || i === GRID_COLUMNS ? {} : VERTICAL_DASH)}
                  />
                ))}
                <g data-slot="profit-margin-analysis-chart-marks" data-series={s} className={cn("transition-opacity duration-300 motion-reduce:transition-none", emphasis && emphasis !== s && "opacity-35")}>
                  {point && (
                    // the cursor: a 2px line in the line's colour with round ends, the row's full height
                    <g data-slot="profit-margin-analysis-chart-cursor" data-series={s}>
                      <line
                        data-slot="profit-margin-analysis-chart-cursor-line"
                        data-series={s}
                        x1={point.x}
                        x2={point.x}
                        y1={0}
                        y2={ROW_HEIGHT}
                        strokeWidth={CURSOR_WIDTH}
                        strokeLinecap="round"
                        className={cn("origin-center [transform-box:fill-box]", tone.stroke)}
                      />
                    </g>
                  )}
                  {line.length > 0 && (
                    <>
                      {/* Figma "Chart Shape": the line's colour at 25% down to the row's bottom */}
                      <path
                        data-slot="profit-margin-analysis-chart-area"
                        data-series={s}
                        d={areaPath(line, ROW_HEIGHT)}
                        fillOpacity={AREA_OPACITY}
                        clipPath={`url(#${ids}-${s}-wipe)`}
                        className={tone.fill}
                      />
                      <path data-slot="profit-margin-analysis-chart-line" data-series={s} d={d} fill="none" strokeWidth={1} className={tone.stroke} />
                    </>
                  )}
                  {point && (
                    <g data-slot="profit-margin-analysis-chart-dot" data-series={s}>
                      <g data-slot="profit-margin-analysis-chart-dot-pop" data-series={s} className="origin-center [transform-box:fill-box]" filter={`url(#${ids}-${s}-dot)`}>
                        <circle cx={point.x} cy={point.y} r={DOT_RADIUS} className="fill-surface-white" />
                        <path d={ringPath(point.x, point.y)} fillRule="evenodd" className={tone.fill} />
                      </g>
                    </g>
                  )}
                </g>
              </svg>

              <RowLabel series={s} label={labels[s]} value={point?.value} format={percent} left={labelLeft} />

              <div
                role="slider"
                tabIndex={line.length ? 0 : -1}
                aria-label={period ? `${labels[s]}, ${period.label}` : labels[s]}
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={Math.max(0, line.length - 1)}
                aria-valuenow={Math.max(0, active[s])}
                aria-valuetext={describe(s)}
                data-slot="profit-margin-analysis-chart-scrubber"
                data-series={s}
                onPointerMove={(event) => {
                  setHoveredTime(timeAt(s, event))
                  setTipSeries(s)
                }}
                onPointerLeave={() => {
                  setHoveredTime(null)
                  setTipSeries(null)
                }}
                onPointerUp={(event) => {
                  if (event.button !== 0) return
                  const time = timeAt(s, event)
                  if (time !== null) setSelectedTime(new Date(time).toISOString())
                }}
                onKeyDown={(event) => onKeyDown(s, event)}
                onBlur={() => setTipSeries((current) => (current === s && hoveredTime === null ? null : current))}
                className={cn("absolute inset-0 cursor-pointer touch-pan-y rounded-lg outline-none focus-visible:ring-2", RING)}
              />

              {tooltip && tipSeries === s && (
                <div
                  ref={tipRef}
                  aria-hidden
                  data-slot="profit-margin-analysis-chart-tooltip"
                  className={cn(
                    "pointer-events-none absolute z-10 flex flex-col items-start gap-2 overflow-hidden rounded-[10px] bg-surface-loud py-2 pr-4 pl-2 whitespace-nowrap",
                    // Figma paints later effects on top; CSS paints the first shadow on top
                    "shadow-[inset_0_2px_8px_rgb(255_255_255/0.24),0_0_0_1px_var(--surface-muted),0_2px_4px_rgb(0_0_0/0.06),0_4px_16px_rgb(0_0_0/0.08)]",
                  )}
                  style={{ left: tipLeft, top: tipTop }}
                >
                  <ChartTooltipLines label={tooltip.date} value={tooltip.value} />
                </div>
              )}
              {/* the same lines, measured to place the tooltip */}
              {tooltip && tipSeries === s && (
                <span ref={sizerRef} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 flex flex-col items-start gap-2 whitespace-nowrap">
                  <ChartTooltipLines label={tooltip.date} value={tooltip.value} />
                </span>
              )}
            </div>
          )
        })}

        {insight && (
          // Figma "Header Cell": #fbfbfb inside a 1px Border/Soft stroke, 8px corners
          <div data-slot="profit-margin-analysis-chart-insight" className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-[#fbfbfb] p-[11px]">
            <span className="flex shrink-0 items-center gap-2">
              {/* Figma's sparkle is the 14px insight icon at 16px, in purple-500 */}
              <span data-slot="profit-margin-analysis-chart-insight-icon" className="flex size-4 shrink-0 text-primary-purple-500">
                <InsightIcon className="size-4" />
              </span>
              {/* not hug-w: Chrome sets "Insights:" 0.08px wider than Figma's 53px box, and a whole pixel more would push the
                  insight right */}
              <span className="typo-body-02-semibold whitespace-nowrap leading-5 text-fg-loud">{insightLabel}</span>
            </span>
            {/* a 20px line box: one line sits where Figma's 14px box does (the row is the label's 20px), and an insight that
                wraps gets some air between its lines */}
            <p ref={insightRef} aria-live="polite" className="typo-label-02-medium min-w-0 flex-1 leading-5 text-fg-normal">
              {insight}
            </p>
          </div>
        )}
      </div>
    </ChartCard>
  )
}

export {
  ProfitMarginAnalysisChart,
  sampleProfitMarginPeriods,
  type ProfitMarginAnalysisChartProps,
  type ProfitMarginPeriod,
  type ProfitMarginPoint,
  type ProfitMarginSeries,
}
