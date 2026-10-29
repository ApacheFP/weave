import React from 'react';
import { number, totals } from './domain.js';
import { localDate } from './workspaceData.js';
import { BudgetOverviewChart } from './charts/BudgetOverviewChart.tsx';
import { BarLineChartIcon, PackageIcon, ShoppingBagIcon, downloadCsv } from './charts/chart-primitives.tsx';
import { CashFlowAreaChart } from './charts/CashFlowAreaChart.tsx';
import { ProfitMarginAnalysisChart } from './charts/ProfitMarginAnalysisChart.tsx';
import { SalesTargetChart } from './charts/SalesTargetChart.tsx';

const DAY_MS = 86_400_000;

function portfolioCosts(items) {
  return items.reduce((sum, item) => {
    const cost = totals(item);
    return {
      materials: sum.materials + cost.materials * item.quantity,
      fabric: sum.fabric + item.consumption * item.fabricPrice * item.quantity,
      accessories: sum.accessories + item.trims.reduce((trimTotal, trim) => trimTotal + trim.qty * trim.price, 0) * item.quantity,
      labor: sum.labor + cost.labor * item.quantity,
      logistics: sum.logistics + item.logisticsCost * item.quantity,
      garments: sum.garments + item.quantity,
    };
  }, { materials: 0, fabric: 0, accessories: 0, labor: 0, logistics: 0, garments: 0 });
}

function projectedShare({ start, end }, day) {
  return end > start ? Math.max(0, Math.min(1, (day - start) / (end - start))) : day >= end ? 1 : 0;
}

function marginPeriods(items) {
  const views = [
    { value: 'all', label: 'Tutti i capi', items },
    { value: 'started', label: 'Capi avviati', items: items.filter(item => item.produced > 0) },
    { value: 'pending', label: 'Da avviare', items: items.filter(item => item.produced === 0) },
  ].filter(view => view.items.length);
  const labels = new Map();
  const periods = views.map(view => {
    const groups = new Map();
    for (const item of view.items) {
      const key = `${item.start}:${item.end}`;
      const group = groups.get(key) || { start: Date.parse(`${item.start}T00:00:00Z`), end: Date.parse(`${item.end}T00:00:00Z`), items: [] };
      group.items.push(item);
      groups.set(key, group);
    }
    const rows = [...groups.values()].sort((a, b) => a.start - b.start).map(group => {
      const time = new Date(group.start + (group.end - group.start) / 2).toISOString();
      const quantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
      const cost = group.items.reduce((sum, item) => sum + totals(item).cost * item.quantity, 0);
      const wholesale = group.items.reduce((sum, item) => sum + item.wholesale * item.quantity, 0);
      const retail = group.items.reduce((sum, item) => sum + item.retail * item.quantity, 0);
      const label = group.items.map(item => `${item.title} · ${item.variant}`).join(', ');
      labels.set(`${view.value}:${time}`, label);
      return { time, b2b: wholesale ? (wholesale - cost) / wholesale * 100 : 0, b2c: retail ? (retail - cost) / retail * 100 : 0, quantity, cost, wholesale, retail };
    });
    const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    const cost = rows.reduce((sum, row) => sum + row.cost, 0);
    const wholesale = rows.reduce((sum, row) => sum + row.wholesale, 0);
    const retail = rows.reduce((sum, row) => sum + row.retail, 0);
    const start = Math.min(...[...groups.values()].map(group => group.start));
    const end = Math.max(...[...groups.values()].map(group => group.end)) + DAY_MS;
    return {
      value: view.value,
      label: view.label,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      gross: rows.map(row => ({ time: row.time, value: row.b2b })),
      net: rows.map(row => ({ time: row.time, value: row.b2c })),
      insight: `Medie ponderate: B2B ${number(wholesale ? (wholesale - cost) / wholesale * 100 : 0, 1)}% · retail ${number(retail ? (retail - cost) / retail * 100 : 0, 1)}% · ${number(quantity)} capi.`,
    };
  });
  return { periods, labels };
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
    return { value: view.value, label: view.label, spent: { fabric: cost.fabric, accessories: cost.accessories }, remaining: cost.labor, saved: cost.logistics };
  });
  const planned = items.map(item => {
    const cost = totals(item);
    return { amount: cost.cost * item.quantity, materials: cost.materials * item.quantity, start: Date.parse(`${item.start}T00:00:00Z`), end: Date.parse(`${item.end}T00:00:00Z`) };
  });
  const firstDay = Math.min(...planned.map(row => row.start));
  const lastDay = Math.max(...planned.map(row => row.end));
  const span = Math.max(0, lastDay - firstDay);
  const count = Math.min(32, Math.max(9, Math.ceil(span / DAY_MS) + 1));
  const data = Array.from({ length: count }, (_, index) => {
    const day = firstDay + Math.round(span * index / (count - 1));
    return { date: new Date(day).toISOString().slice(0, 10), value: planned.reduce((sum, row) => sum + row.amount * projectedShare(row, day), 0) };
  });
  const materials = Array.from({ length: count }, (_, index) => {
    const day = firstDay + Math.round(span * index / (count - 1));
    return planned.reduce((sum, row) => sum + row.materials * projectedShare(row, day), 0);
  });
  const total = planned.reduce((sum, row) => sum + row.amount, 0);
  const today = Date.parse(`${localDate()}T00:00:00Z`);
  const nextMonth = today + 30 * DAY_MS;
  const upcoming = planned.reduce((sum, row) => sum + row.amount * Math.max(0, projectedShare(row, nextMonth) - projectedShare(row, today)), 0);
  const defaultIndex = data.reduce((best, point, index) => Math.abs(Date.parse(`${point.date}T00:00:00Z`) - today) < Math.abs(Date.parse(`${data[best].date}T00:00:00Z`) - today) ? index : best, 0);
  const cost = portfolioCosts(items);
  const { periods: marginData, labels: marginLabels } = marginPeriods(items);
  const retailRevenue = items.reduce((sum, item) => sum + item.retailSold * (item.retailAverage || item.retail), 0);
  const retailTarget = items.reduce((sum, item) => sum + (item.retailTarget || item.quantity) * item.retail, 0);

  return <>
    <CashFlowAreaChart
      title="Andamento dei costi stimati"
      description="Totale e materiali · proiezione sulle date di produzione"
      icon={<BarLineChartIcon />}
      totalLabel="Costo industriale previsto"
      total={total}
      changeLabel="Uscite stimate · 30 giorni"
      change={-upcoming}
      data={data}
      compare={materials}
      compareLabel="Materiali"
      defaultIndex={defaultIndex}
      locale="it-IT"
      currency="EUR"
    />
    <BudgetOverviewChart
      title="Composizione dei costi"
      account={`${number(items.length)} varianti · ${number(cost.garments)} capi pianificati`}
      categories={[
        { id: 'fabric', name: 'Tessuto', icon: <ShoppingBagIcon />, color: 'orange' },
        { id: 'accessories', name: 'Accessori', icon: <PackageIcon />, color: 'purple' },
      ]}
      periods={periods}
      defaultPeriod="all"
      spentLabel="Materiali"
      remainingLabel="Lavorazione"
      savedLabel="Logistica"
      locale="it-IT"
      currency="EUR"
    />
    <ProfitMarginAnalysisChart
      title="Margini stimati per capo"
      description="Confronto B2B e retail · calendario di produzione"
      periods={marginData}
      defaultPeriod="all"
      grossLabel="Margine B2B"
      netLabel="Margine retail"
      grossLegendLabel="B2B · prezzo wholesale"
      netLegendLabel="Retail · prezzo di listino"
      insightLabel="Sintesi:"
      formatTime={(time, period) => marginLabels.get(`${period.value}:${time}`) || new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(time))}
      onMoreClick={() => downloadCsv('margini-stimati-atelier.csv', [
        ['Capo', 'Margine B2B', 'Margine retail'],
        ...marginData[0].gross.map((point, index) => [marginLabels.get(`${marginData[0].value}:${point.time}`), point.value, marginData[0].net[index]?.value ?? '']),
      ])}
      locale="it-IT"
    />
    <SalesTargetChart
      title="Obiettivo di vendita retail"
      value={retailRevenue}
      valueLabel="Venduto retail stimato"
      target={retailTarget}
      revenueLabel="Venduto retail"
      targetLabel="Target a listino"
      onMoreClick={() => downloadCsv('obiettivo-vendite-retail.csv', [
        ['Capo', 'Capi venduti', 'Incasso retail stimato', 'Capi obiettivo', 'Target a listino'],
        ...items.map(item => [
          `${item.title} · ${item.variant}`,
          item.retailSold,
          item.retailSold * (item.retailAverage || item.retail),
          item.retailTarget || item.quantity,
          (item.retailTarget || item.quantity) * item.retail,
        ]),
        ['Totale Atelier', items.reduce((sum, item) => sum + item.retailSold, 0), retailRevenue, items.reduce((sum, item) => sum + (item.retailTarget || item.quantity), 0), retailTarget],
      ])}
      locale="it-IT"
      currency="EUR"
    />
  </>;
}
