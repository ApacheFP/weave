import React from 'react';
import { number, totals } from './domain.js';
import { localDate } from './workspaceData.js';
import { BudgetOverviewChart } from './charts/BudgetOverviewChart.tsx';
import { BarLineChartIcon, ShoppingBagIcon } from './charts/chart-primitives.tsx';
import { CashFlowAreaChart } from './charts/CashFlowAreaChart.tsx';

const DAY_MS = 86_400_000;

function portfolioCosts(items) {
  return items.reduce((sum, item) => {
    const cost = totals(item);
    return {
      materials: sum.materials + cost.materials * item.quantity,
      labor: sum.labor + cost.labor * item.quantity,
      logistics: sum.logistics + item.logisticsCost * item.quantity,
      garments: sum.garments + item.quantity,
    };
  }, { materials: 0, labor: 0, logistics: 0, garments: 0 });
}

function projectedShare({ start, end }, day) {
  return end > start ? Math.max(0, Math.min(1, (day - start) / (end - start))) : day >= end ? 1 : 0;
}

export default function AtelierFinancialCharts({ items }) {
  if (!items.length) return null;

  const subsets = [
    { value: 'all', label: 'Tutti i capi', items },
    { value: 'started', label: 'Capi avviati', items: items.filter(item => item.produced > 0) },
    { value: 'pending', label: 'Da avviare', items: items.filter(item => item.produced === 0) },
  ];
  const periods = subsets.map(view => {
    const cost = portfolioCosts(view.items);
    return { value: view.value, label: view.label, spent: { materials: cost.materials }, remaining: cost.labor, saved: cost.logistics };
  });
  const planned = items.map(item => ({ amount: totals(item).cost * item.quantity, start: Date.parse(`${item.start}T00:00:00Z`), end: Date.parse(`${item.end}T00:00:00Z`) }));
  const firstDay = Math.min(...planned.map(row => row.start));
  const lastDay = Math.max(...planned.map(row => row.end));
  const span = Math.max(0, lastDay - firstDay);
  const count = Math.min(32, Math.max(9, Math.ceil(span / DAY_MS) + 1));
  const data = Array.from({ length: count }, (_, index) => {
    const day = firstDay + Math.round(span * index / (count - 1));
    return { date: new Date(day).toISOString().slice(0, 10), value: planned.reduce((sum, row) => sum + row.amount * projectedShare(row, day), 0) };
  });
  const total = planned.reduce((sum, row) => sum + row.amount, 0);
  const today = Date.parse(`${localDate()}T00:00:00Z`);
  const nextMonth = today + 30 * DAY_MS;
  const upcoming = planned.reduce((sum, row) => sum + row.amount * Math.max(0, projectedShare(row, nextMonth) - projectedShare(row, today)), 0);
  const defaultIndex = data.reduce((best, point, index) => Math.abs(Date.parse(`${point.date}T00:00:00Z`) - today) < Math.abs(Date.parse(`${data[best].date}T00:00:00Z`) - today) ? index : best, 0);
  const cost = portfolioCosts(items);

  return <>
    <CashFlowAreaChart
      title="Andamento dei costi stimati"
      description="Tutti i capi · proiezione sulle date di produzione"
      icon={<BarLineChartIcon />}
      totalLabel="Costo industriale previsto"
      total={total}
      changeLabel="Prossimi 30 giorni"
      change={upcoming}
      changeTone="neutral"
      data={data}
      compare={[]}
      defaultIndex={defaultIndex}
      locale="it-IT"
      currency="EUR"
    />
    <BudgetOverviewChart
      title="Composizione dei costi"
      account={`${number(items.length)} varianti · ${number(cost.garments)} capi pianificati`}
      categories={[{ id: 'materials', name: 'Materiali', icon: <ShoppingBagIcon />, color: 'orange' }]}
      periods={periods}
      defaultPeriod="all"
      spentLabel="Materiali"
      remainingLabel="Lavorazione"
      savedLabel="Logistica"
      showCategories={false}
      locale="it-IT"
      currency="EUR"
    />
  </>;
}
