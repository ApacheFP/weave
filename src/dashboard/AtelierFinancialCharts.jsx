import React from 'react';
import { number, totals } from './domain.js';
import { productSpec } from './productData.js';
import { localDate } from './workspaceData.js';
import { BudgetOverviewChart } from './charts/BudgetOverviewChart.tsx';
import { BarLineChartIcon, PackageIcon, ShoppingBagIcon } from './charts/chart-primitives.tsx';
import { CashFlowAreaChart } from './charts/CashFlowAreaChart.tsx';
import { Icon } from './ui.jsx';

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

function portfolioCostDetails(items) {
  const result = { fabric: 0, accessories: 0, preparation: 0, assembly: 0, finishing: 0, logistics: 0 };
  for (const item of items) {
    const quantity = item.quantity;
    const labor = item.laborMinutes * item.hourlyRate / 60 * quantity;
    result.fabric += item.consumption * item.fabricPrice * quantity;
    result.accessories += item.trims.reduce((sum, trim) => sum + trim.qty * trim.price, 0) * quantity;
    result.logistics += item.logisticsCost * quantity;
    const operations = productSpec(item).operations;
    const minutes = operations.reduce((sum, [, , duration]) => sum + duration, 0);
    if (!minutes) result.assembly += labor;
    else for (const [name, , duration] of operations) {
      const group = /taglio|programmazione|smacchinatura/i.test(name)
        ? 'preparation'
        : /finitura|prova|stiro|lavaggio|stabilizzazione|vaporizzo|misure|etichetta|qualità|controllo/i.test(name)
          ? 'finishing'
          : 'assembly';
      result[group] += labor * duration / minutes;
    }
  }
  return result;
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
    const details = portfolioCostDetails(view.items);
    return {
      value: view.value,
      label: view.label,
      spent: { fabric: cost.fabric, accessories: cost.accessories },
      remaining: cost.labor,
      saved: cost.logistics,
      details: [
        { id: 'fabric', name: 'Tessuto e filato', icon: <ShoppingBagIcon />, color: 'orange', amount: details.fabric },
        { id: 'accessories', name: 'Accessori e componenti', icon: <PackageIcon />, color: 'purple', amount: details.accessories },
        { id: 'preparation', name: 'Preparazione e taglio', icon: <Icon name="scissors" size={14} />, color: 'blue', amount: details.preparation },
        { id: 'assembly', name: 'Assemblaggio e confezione', icon: <Icon name="settings" size={14} />, color: 'green', amount: details.assembly },
        { id: 'finishing', name: 'Finiture e controllo qualità', icon: <Icon name="check" size={14} />, color: 'yellow', amount: details.finishing },
        { id: 'logistics', name: 'Logistica', icon: <Icon name="truck" size={14} />, color: 'blue', amount: details.logistics },
      ],
    };
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
        { id: 'fabric', name: 'Tessuto e filato', icon: <ShoppingBagIcon />, color: 'orange' },
        { id: 'accessories', name: 'Accessori e componenti', icon: <PackageIcon />, color: 'purple' },
      ]}
      periods={periods}
      defaultPeriod="all"
      spentLabel="Materiali"
      remainingLabel="Lavorazione"
      savedLabel="Logistica"
      locale="it-IT"
      currency="EUR"
    />
  </>;
}
