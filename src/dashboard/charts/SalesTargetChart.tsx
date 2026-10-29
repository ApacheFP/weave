"use client"

import { animate, stagger, utils } from "animejs"
import * as React from "react"

import { ChartButton, ChartCard, DotsHorizontalIcon, ChartLegendLine, ChartTooltipLines, ChartMenu, ChartMenuContent, ChartMenuItem, ChartMenuTrigger, cn } from "./chart-primitives"
import { releaseStyles, useChartEntrance, useCountUp, useIsomorphicLayoutEffect, useReducedMotion } from "./chart-hooks"
import { useChartSize } from "./chart-size"
import { formatCurrency, formatPercentValue as formatPercent } from "./chart-format"
import './chart-theme.css' 

type SalesTargetChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  title?: string
  /** The revenue so far: the purple bars fill up to it. */
  value?: number
  /** The line under the revenue. */
  valueLabel?: string
  /** The period's target: the whole meter. */
  target?: number
  /** The legend's name for the purple bars (the revenue). */
  revenueLabel?: string
  /** The legend's name for the grey bars (the rest of the target). */
  targetLabel?: string
  /** How many bars the meter has; each stands for an equal share of the target and fills once it is earned. */
  bars?: number
  /** The percentages of the target under the meter, each at its place (0 and 100 at the ends). */
  ticks?: number[]
  /** Called by the ⋯ button. */
  onMoreClick?: () => void
  locale?: string
  currency?: string
}

// Figma geometry ("Sales Target Chart" 1473:82726)
const METER_WIDTH = 564
const METER_HEIGHT = 35 // a filled bar: 35px of purple…
const TRACK_HEIGHT = 16 // …the others 16px of grey, centred on it
const BAR_GAP = 2 // 55 bars 8.29px wide, 2px apart; on a narrow card they narrow first…
const MIN_BAR = 1 // …down to 1px, then the gaps close
const BAR_RADIUS = 2
const TIP_GAP = 8 // the tooltip ends 8px above the meter
const TIP_PADDING_X = 24 // its 12px side padding, twice
const TIP_PADDING_Y = 16 // and its 8px top and bottom padding
const BARS_AT = 450
const BAR_STAGGER = 45
const SWELL = 650 // a bar turning purple: 16px of grey swelling to 35px
const RING = "focus-visible:ring-primary-purple-500/40" // the card's focus rings are purple

const round = (n: number) => Math.round(n * 1000) / 1000

/** The bars' left edges: equal bars spread from edge to edge, 2px apart while they are at least 1px wide. */
function layoutBars(width: number, count: number) {
  const n = Math.max(1, Math.round(count))
  const barWidth = round(Math.max(MIN_BAR, (width - (n - 1) * BAR_GAP) / n))
  const pitch = n > 1 ? (width - barWidth) / (n - 1) : 0
  const xs = Array.from({ length: n }, (_, i) => round(n > 1 ? i * pitch : (width - barWidth) / 2))
  return { n, barWidth, pitch, xs }
}

/** How many bars are filled: each one once its share of the target is earned. */
function filledBars(value: number, target: number, n: number) {
  if (!(target > 0) || !(value > 0)) return 0
  return Math.min(n, Math.floor((value / target) * n + 1e-9))
}

/** One axis label: 0% and 100% inside the meter's ends, the others centred on their share of it. */
function tickStyle(tick: number, width: number): React.CSSProperties {
  if (tick <= 0) return { left: 0 }
  if (tick >= 100) return { right: 0 }
  return { left: round((tick / 100) * width) }
}

/**
 * "Sales Target Chart" from the Keitoto library: the revenue so far over its label, a legend, and a meter of 55 bars
 * from 0% to 100% of the monthly target: purple and full height for the revenue, short and grey for the rest. Hover,
 * drag or arrow along the meter: each bar shows its share and amount of the target and how much is left to earn up to
 * it, the bars on the way to it light up and the earned ones after it dim. Animated with anime.js: the legend comes
 * in, the grey bars rise from left to right, then the earned ones swell purple one after another while the revenue
 * counts up; new figures fill or empty the bars while the revenue counts.
 */
function SalesTargetChart({
  title = "Sales Target",
  value = 10910,
  valueLabel = "Project Earnings",
  target = 40000,
  revenueLabel = "Actual Revenue",
  targetLabel = "Monthly Target",
  bars = 55,
  ticks = [0, 25, 50, 75, 100],
  onMoreClick,
  locale = "en-US",
  currency = "USD",
  className,
  ...props
}: SalesTargetChartProps) {
  const [meterRef, meter] = useChartSize<HTMLDivElement>({ width: METER_WIDTH, height: METER_HEIGHT })
  const width = meter.width || METER_WIDTH
  const { n, barWidth, pitch, xs } = React.useMemo(() => layoutBars(width, bars), [width, bars])
  const filled = filledBars(value, target, n)

  const money = React.useCallback((amount: number) => formatCurrency(amount, { locale, currency }), [locale, currency])
  const valueMoney = money
  const share = React.useCallback((percent: number) => formatPercent(percent, { locale, maximumFractionDigits: 0 }), [locale])
  const tickText = (tick: number) => formatPercent(tick, { locale, maximumFractionDigits: 1 })
  const targetText = money(target)

  // The bar under the pointer (or picked with the keys) and what it stands for. The last one is kept after the pointer
  // leaves, so the tooltip can fade out with its text.
  const [inspect, setInspect] = React.useState({ bar: -1, on: false })
  const setInspected = (bar: number | null) => setInspect((current) => (bar === null ? { ...current, on: false } : { bar, on: true }))
  const k = inspect.bar >= 0 ? Math.min(inspect.bar, n - 1) : null
  const active = inspect.on ? k : null
  const milestone = k !== null ? (target * (k + 1)) / n : 0
  const toGo = Math.max(0, milestone - value)
  const tooltip = k !== null ? { label: `${share(((k + 1) / n) * 100)} · ${money(milestone)}`, value: toGo > 0.005 ? `${money(toGo)} to go` : "Reached" } : null
  const [sizerRef, sizer] = useChartSize<HTMLSpanElement>({ width: 120, height: 38 })
  const tipWidth = sizer.width + TIP_PADDING_X
  const tipHeight = sizer.height + TIP_PADDING_Y
  const tipLeft = k !== null ? Math.round(Math.min(Math.max(xs[k] + barWidth / 2 - tipWidth / 2, 0), Math.max(0, width - tipWidth))) : 0

  const reduced = useReducedMotion()
  const root = React.useRef<HTMLDivElement>(null)
  const valueRef = React.useRef<HTMLParagraphElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const valueText = valueMoney(value)
  // what the entrance's counter needs when it runs (new figures may come in before it is done)
  const latest = React.useRef({ value, valueText })
  useIsomorphicLayoutEffect(() => {
    latest.current = { value, valueText }
  })
  const all = (selector: string) => Array.from(root.current?.querySelectorAll<HTMLElement | SVGElement>(selector) ?? [])

  // A new revenue counts from the previous one.
  useCountUp(valueRef, value, valueMoney, { duration: 900 })

  // Entrance, once the card is in view: the legend comes in, the grey bars rise from left to right, then the earned
  // ones swell from 16px of grey to 35px of purple one after another while the revenue counts up along with them,
  // and the percentages come in under the meter.
  useChartEntrance(root, (timeline) => {
    const valueEl = valueRef.current
    const counter = { t: 0 }
    const count = () => {
      if (valueEl) valueEl.textContent = valueMoney(latest.current.value * counter.t)
    }
    count()
    const fillSpan = Math.max(600, (filled - 1) * BAR_STAGGER + SWELL * 0.7)
    timeline
      .add(all('[data-slot="sales-target-chart-legend-item"]'), { opacity: { from: 0 }, translateY: { from: 4 }, duration: 500, ease: "outQuad", delay: stagger(90) }, 100)
      .add(all('[data-slot="sales-target-chart-track"]'), { opacity: { from: 0 }, scaleY: { from: 0.2 }, duration: 500, ease: "outQuad", delay: stagger(6) }, 150)
      .add(all('[data-slot="sales-target-chart-bar"][data-filled]'), { opacity: { from: 0 }, scaleY: { from: TRACK_HEIGHT / METER_HEIGHT }, duration: SWELL, ease: "outBack(1.7)", delay: stagger(BAR_STAGGER) }, BARS_AT)
      .add(counter, { t: [0, 1], duration: fillSpan, ease: "outQuad", onUpdate: count }, BARS_AT)
      .add(all('[data-slot="sales-target-chart-tick"]'), { opacity: { from: 0 }, translateY: { from: 4 }, duration: 600, ease: "outQuad", delay: stagger(70) }, 350)
    return () => {
      if (valueEl) valueEl.textContent = latest.current.valueText
    }
  })

  // New figures swell the bars that are now earned one after another, or empty the ones that no longer are, from the
  // end back. A new number of bars is laid out again without a sweep.
  const lastFilled = React.useRef({ filled, n })
  useIsomorphicLayoutEffect(() => {
    const before = lastFilled.current
    lastFilled.current = { filled, n }
    if (reduced || before.n !== n || before.filled === filled) return
    const shapes = all('[data-slot="sales-target-chart-bar"]')
    if (filled > before.filled) {
      animate(shapes.slice(before.filled, filled), {
        opacity: [0, 1],
        scaleY: [TRACK_HEIGHT / METER_HEIGHT, 1],
        duration: 550,
        ease: "outBack(1.6)",
        delay: stagger(35),
        onComplete: releaseStyles("opacity", "transform"),
      })
      return
    }
    const emptied = shapes.slice(filled, before.filled).reverse()
    // they are already hidden by React: keep them up while they shrink back to grey
    utils.set(emptied, { opacity: 1 })
    animate(emptied, { opacity: [1, 0], scaleY: [1, TRACK_HEIGHT / METER_HEIGHT], duration: 420, ease: "inQuad", delay: stagger(35), onComplete: releaseStyles("opacity", "transform") })
  }, [filled, n, reduced])

  // The tooltip fades in over the inspected bar and slides along when another bar is inspected.
  const lastTip = React.useRef({ shown: active !== null, left: tipLeft, width })
  useIsomorphicLayoutEffect(() => {
    const before = lastTip.current
    const shown = active !== null
    lastTip.current = { shown, left: tipLeft, width }
    const tip = tipRef.current
    if (!tip || reduced) return
    if (before.shown !== shown) {
      const from = tip.style.opacity === "" ? (shown ? 0 : 1) : Number(tip.style.opacity)
      animate(tip, {
        opacity: [from, shown ? 1 : 0],
        scale: shown ? [0.94, 1] : [1, 0.97],
        translateY: shown ? [4, 0] : [0, 2],
        duration: shown ? 320 : 180,
        ease: shown ? "outBack(1.6)" : "outQuad",
        onComplete: releaseStyles("opacity", "transform"),
      })
      return
    }
    if (shown && before.left !== tipLeft && before.width === width)
      animate(tip, { translateX: [before.left - tipLeft + utils.get(tip, "translateX", false), 0], duration: 380, ease: "outExpo", onComplete: releaseStyles("transform") })
  }, [active, tipLeft, width, reduced])

  // The meter is a slider over the bars: the pointer or the arrow keys pick one, and its tooltip says what it stands for.
  const barAt = (event: React.PointerEvent<HTMLElement>) => {
    const el = event.currentTarget
    const box = el.getBoundingClientRect()
    // CSS zoom (the live demo scales wide demos down) scales the box but not the layout
    const zoom = box.width / (el.offsetWidth || box.width || 1) || 1
    const x = (event.clientX - box.left) / zoom
    return n > 1 && pitch > 0 ? Math.min(n - 1, Math.max(0, Math.round((x - barWidth / 2) / pitch))) : 0
  }
  const resting = Math.max(0, filled - 1)
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const at = active ?? resting
    const page = Math.max(1, Math.round(n / 10))
    const next = { ArrowRight: at + 1, ArrowUp: at + 1, ArrowLeft: at - 1, ArrowDown: at - 1, PageUp: at + page, PageDown: at - page, Home: 0, End: n - 1 }[event.key]
    if (event.key === "Escape") {
      setInspected(null)
      return
    }
    if (next === undefined) return
    event.preventDefault()
    setInspected(Math.min(n - 1, Math.max(0, next)))
  }
  const valueAt = (i: number) => {
    const amount = (target * (i + 1)) / n
    const left = Math.max(0, amount - value)
    return `${share(((i + 1) / n) * 100)} of the target, ${money(amount)}: ${left > 0.005 ? `${money(left)} to go` : "reached"}`
  }

  const legend = [
    { key: "revenue", label: revenueLabel, line: "text-primary-purple-500" },
    { key: "target", label: targetLabel, line: "text-surface-soft" },
  ]

  return (
    <ChartCard ref={root} role="group" aria-label={title} className={cn("w-full", className)} {...props}>
      <div className="flex items-center justify-between gap-20">
        {/* the padding keeps the descenders out of truncate's clip (the text styles have a line height of 1) */}
        <p className="typo-heading-01-semibold -my-0.5 min-w-0 flex-1 truncate py-0.5 text-fg-loud">{title}</p>
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

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        {/* the legend wraps under the revenue on a narrow card */}
        <div className="flex max-w-full flex-[1_0_auto] flex-col gap-2">
          <p ref={valueRef} data-slot="sales-target-chart-value" className="typo-heading-03-semibold hug-w whitespace-nowrap text-fg-loud">
            {valueText}
          </p>
          <p className="typo-label-02-medium -my-0.5 truncate py-0.5 text-fg-normal">{valueLabel}</p>
        </div>
        {/* Figma "Actual Revenue Row": 4px lines before the labels, 12px apart */}
        <div className="flex shrink-0 items-center gap-3 py-1">
          {legend.map((item) => (
            <span key={item.key} data-slot="sales-target-chart-legend-item" className="flex items-center gap-1.5">
              <ChartLegendLine className={item.line} />
              <span className="typo-label-02-medium hug-w whitespace-nowrap text-fg-normal">{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div
          ref={meterRef}
          role="slider"
          tabIndex={0}
          aria-label={`${revenueLabel}: ${money(value)} of ${targetText}`}
          aria-orientation="horizontal"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={(active ?? resting) + 1}
          aria-valuetext={valueAt(active ?? resting)}
          data-slot="sales-target-chart-meter"
          onPointerMove={(event) => setInspected(barAt(event))}
          onPointerLeave={() => setInspected(null)}
          onPointerDown={(event) => setInspected(barAt(event))}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible")) setInspected(resting)
          }}
          onBlur={() => setInspected(null)}
          onKeyDown={onKeyDown}
          className={cn("relative shrink-0 cursor-pointer touch-pan-y rounded-[3px] outline-none focus-visible:ring-2", RING)}
          style={{ height: METER_HEIGHT }}
        >
          <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {xs.map((x, i) => {
              // inspecting a bar past the earned ones lights the bars on the way to it; one among them dims the earned
              // bars after it
              const onTheWay = active !== null && i >= filled && i <= active
              const after = active !== null && i < filled && i > active
              return (
                <g key={i}>
                  {/* Figma "Bar": 16px of Background/Soft, centred, 2px corners… */}
                  <rect
                    data-slot="sales-target-chart-track"
                    x={x}
                    y={(METER_HEIGHT - TRACK_HEIGHT) / 2}
                    width={barWidth}
                    height={TRACK_HEIGHT}
                    rx={BAR_RADIUS}
                    className={cn("origin-center transition-[fill] duration-200 [transform-box:fill-box]", onTheWay ? "fill-primary-purple-100" : "fill-surface-soft")}
                  />
                  {/* …and 35px of Primary/Purple/purple-500 once earned */}
                  <rect
                    data-slot="sales-target-chart-bar"
                    data-filled={i < filled || undefined}
                    x={x}
                    y={0}
                    width={barWidth}
                    height={METER_HEIGHT}
                    rx={BAR_RADIUS}
                    className={cn(
                      "origin-center transition-[fill] duration-200 [transform-box:fill-box]",
                      i < filled ? "opacity-100" : "opacity-0",
                      after ? "fill-primary-purple-500/35" : "fill-primary-purple-500",
                    )}
                  />
                </g>
              )
            })}
          </svg>

          {tooltip && (
            <div
              ref={tipRef}
              aria-hidden
              data-slot="sales-target-chart-tooltip"
              className={cn(
                "pointer-events-none absolute z-10 flex flex-col items-start gap-2 overflow-hidden rounded-[10px] bg-surface-loud px-3 py-2 whitespace-nowrap",
                // Figma paints later effects on top; CSS paints the first shadow on top
                "shadow-[inset_0_2px_8px_rgb(255_255_255/0.24),0_0_0_1px_var(--surface-muted),0_2px_4px_rgb(0_0_0/0.06),0_4px_16px_rgb(0_0_0/0.08)]",
                active !== null ? "opacity-100" : "opacity-0",
              )}
              style={{ left: tipLeft, top: -tipHeight - TIP_GAP }}
            >
              <ChartTooltipLines label={tooltip.label} value={tooltip.value} />
            </div>
          )}
          {/* the same lines, measured to place the tooltip */}
          {tooltip && (
            <span ref={sizerRef} aria-hidden className="pointer-events-none invisible absolute top-0 left-0 flex flex-col items-start gap-2 whitespace-nowrap">
              <ChartTooltipLines label={tooltip.label} value={tooltip.value} />
            </span>
          )}
        </div>

        {/* Figma "X-Labels": the percentages of the target, 8px under the meter */}
        <div aria-hidden className="relative h-[30px]">
          {ticks.map((tick) => (
            <span key={tick} className={cn("absolute top-2", tick > 0 && tick < 100 && "-translate-x-1/2")} style={tickStyle(tick, width)}>
              <span data-slot="sales-target-chart-tick" className="typo-label-02-regular block whitespace-nowrap text-fg-soft">
                {tickText(tick)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}

export { SalesTargetChart, type SalesTargetChartProps }
