"use client"

import { animate, stagger } from "animejs"
import React, { useCallback, useEffect, useRef, useState } from "react"

import {
  BarLineChartIcon,
  ChartButton,
  ChartCard,
  ChartMenu,
  ChartMenuContent,
  ChartMenuItem,
  ChartMenuRadioGroup,
  ChartMenuRadioItem,
  ChartMenuTrigger,
  DotsHorizontalIcon,
  downloadCsv,
} from "./chart-primitives"
import { useChartEntrance, useReducedMotion } from "./chart-hooks"
import { formatCurrency, formatPercent } from "./chart-format"
import "./chart-theme.css"
import "./atelier-cost-breakdown.css"

type CostColor = "orange" | "purple" | "blue" | "green" | "yellow" | "teal"

type CostDetail = {
  id: string
  name: string
  amount: number
  color?: CostColor
}

type CostPeriod = {
  value: string
  label: string
  details: CostDetail[]
}

type AtelierCostBreakdownChartProps = Omit<React.ComponentProps<"section">, "children"> & {
  title?: string
  account?: string
  periods: CostPeriod[]
  period?: string
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  onMoreClick?: () => void
  locale?: string
  currency?: string
}

const colorVariables: Record<CostColor, string> = {
  orange: "var(--orange)",
  purple: "var(--violet)",
  blue: "var(--blue)",
  green: "var(--green)",
  yellow: "var(--amber)",
  teal: "var(--teal)",
}

function AnimatedValue({
  value,
  format,
  className,
  reducedMotion,
}: {
  value: number
  format: (value: number) => string
  className?: string
  reducedMotion: boolean
}) {
  const element = useRef<HTMLSpanElement>(null)
  const previous = useRef<number | null>(null)

  useEffect(() => {
    const node = element.current
    if (!node) return

    const from = previous.current ?? 0
    previous.current = value
    if (reducedMotion || from === value) {
      node.textContent = format(value)
      return
    }

    const counter = { value: from }
    const animation = animate(counter, {
      value: [from, value],
      duration: 850,
      ease: "outExpo",
      onUpdate: () => { node.textContent = format(counter.value) },
      onComplete: () => { node.textContent = format(value) },
    })
    return () => animation.cancel()
  }, [format, reducedMotion, value])

  return <span ref={element} className={className}>{format(value)}</span>
}

function CostItem({
  detail,
  share,
  money,
  percent,
  reducedMotion,
}: {
  detail: CostDetail
  share: number
  money: (value: number) => string
  percent: (value: number) => string
  reducedMotion: boolean
}) {
  const color = colorVariables[detail.color ?? "blue"]
  return (
    <div className="atelier-cost-item" role="listitem" data-slot="atelier-cost-item">
      <div className="atelier-cost-item-heading">
        <span className="atelier-cost-item-name">
          <i aria-hidden style={{ backgroundColor: color }} />
          <span>{detail.name}</span>
        </span>
        <AnimatedValue value={share} format={percent} className="atelier-cost-share" reducedMotion={reducedMotion} />
      </div>
      <AnimatedValue value={detail.amount} format={money} className="atelier-cost-amount" reducedMotion={reducedMotion} />
      <div className="atelier-cost-item-track" aria-hidden>
        <span style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function downloadBreakdown(period: CostPeriod | undefined, locale: string) {
  const details = period?.details ?? []
  const total = details.reduce((sum, detail) => sum + Math.max(0, detail.amount), 0)
  downloadCsv("composizione-costi-atelier.csv", [
    ["Periodo", period?.label ?? ""],
    [],
    ["Voce", "Importo", "Incidenza"],
    ...details.map(detail => [detail.name, detail.amount, total ? formatPercent(detail.amount / total, { locale, maximumFractionDigits: 1 }) : "0%"]),
    ["Totale costo industriale", total, "100%"],
  ])
}

export function AtelierCostBreakdownChart({
  title = "Composizione dei costi",
  account,
  periods,
  period,
  defaultPeriod,
  onPeriodChange,
  onMoreClick,
  locale = "it-IT",
  currency = "EUR",
  className,
  ...props
}: AtelierCostBreakdownChartProps) {
  const root = useRef<HTMLElement>(null)
  const [internalPeriod, setInternalPeriod] = useState(defaultPeriod ?? periods[0]?.value ?? "")
  const selectedPeriod = period ?? internalPeriod
  const current = periods.find(item => item.value === selectedPeriod) ?? periods[0]
  const details = current?.details ?? []
  const total = details.reduce((sum, detail) => sum + Math.max(0, detail.amount), 0)
  const money = useCallback((value: number) => formatCurrency(value, { locale, currency }), [currency, locale])
  const percent = useCallback((value: number) => formatPercent(value, { locale, maximumFractionDigits: 1 }), [locale])
  const reducedMotion = useReducedMotion()
  const changePeriod = (next: string) => {
    if (period === undefined) setInternalPeriod(next)
    onPeriodChange?.(next)
  }

  useChartEntrance(root, timeline => {
    const element = root.current
    const segments = element?.querySelectorAll<HTMLElement>('[data-slot="atelier-cost-segment"]')
    const rows = element?.querySelectorAll<HTMLElement>('[data-slot="atelier-cost-item"]')
    if (segments?.length) timeline.add(segments, { opacity: { from: 0 }, scaleX: { from: 0 }, duration: 750, ease: "outExpo", delay: stagger(65) }, 120)
    if (rows?.length) timeline.add(rows, { opacity: { from: 0 }, translateY: { from: 8 }, duration: 600, ease: "outExpo", delay: stagger(75) }, 260)
  })

  return (
    <ChartCard ref={root} role="group" aria-label={title} className={`atelier-cost-card ${className ?? ""}`} {...props}>
      <header className="atelier-cost-header">
        <div className="atelier-cost-heading-copy">
          <div className="atelier-cost-title-row">
            <span aria-hidden className="atelier-cost-title-icon"><BarLineChartIcon /></span>
            <h2>{title}</h2>
          </div>
          <div className="atelier-cost-subtitle">
            {account && <><span>{account}</span><i aria-hidden /> </>}
            <ChartMenu>
              <ChartMenuTrigger asChild>
                <button type="button" aria-label={`Periodo: ${current?.label ?? ""}`} className="atelier-cost-period-trigger">
                  {current?.label ?? ""}
                </button>
              </ChartMenuTrigger>
              <ChartMenuContent align="start">
                <ChartMenuRadioGroup value={current?.value ?? ""} onValueChange={changePeriod}>
                  {periods.map(item => <ChartMenuRadioItem key={item.value} value={item.value}>{item.label}</ChartMenuRadioItem>)}
                </ChartMenuRadioGroup>
              </ChartMenuContent>
            </ChartMenu>
          </div>
        </div>
        <ChartMenu>
          <ChartMenuTrigger asChild>
            <ChartButton size="icon" aria-label="Altre opzioni" onClick={onMoreClick}>
              <DotsHorizontalIcon />
            </ChartButton>
          </ChartMenuTrigger>
          <ChartMenuContent align="end">
            <ChartMenuItem onSelect={() => downloadBreakdown(current, locale)}>Esporta dati CSV</ChartMenuItem>
          </ChartMenuContent>
        </ChartMenu>
      </header>

      <div className="atelier-cost-summary">
        <div className="atelier-cost-total">
          <span>Costo industriale previsto</span>
          <AnimatedValue value={total} format={money} className="atelier-cost-total-value" reducedMotion={reducedMotion} />
        </div>
        <div className="atelier-cost-stack" role="img" aria-label={`Composizione del costo industriale: ${details.map(detail => `${detail.name} ${percent(total ? detail.amount / total : 0)}`).join(", ")}`}>
          {details.map(detail => {
            const share = total ? Math.max(0, detail.amount) / total : 0
            return <span key={detail.id} data-slot="atelier-cost-segment" style={{ flexGrow: share * 100, backgroundColor: colorVariables[detail.color ?? "blue"] }} />
          })}
        </div>
      </div>

      <div className="atelier-cost-breakdown" role="list" aria-label="Dettaglio delle voci di costo">
        {details.map(detail => <CostItem key={detail.id} detail={detail} share={total ? detail.amount / total : 0} money={money} percent={percent} reducedMotion={reducedMotion} />)}
      </div>
    </ChartCard>
  )
}

export default AtelierCostBreakdownChart
