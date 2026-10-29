import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../ui.jsx';

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const ChartCard = React.forwardRef<HTMLElement, React.ComponentProps<'section'>>(({ className, children, ...props }, ref) => (
  <section ref={ref} className={`dw-card mebius-chart-card ${className || ''}`} {...props}><div className="dw-card-body">{children}</div></section>
));
ChartCard.displayName = 'ChartCard';

export function ChartButton({ children, size = 'default', corner, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; corner?: string }) {
  return <button type="button" className={`${size === 'icon' ? 'dw-icon-btn' : 'dw-btn'} mebius-chart-button ${size === 'icon' ? 'is-icon' : ''} ${className}`} {...props}>{children}</button>;
}

export function ChartSwatch({ className = '' }: { className?: string }) { return <span aria-hidden className={`mebius-chart-swatch ${className}`} />; }

function SvgIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
export const DotsHorizontalIcon = () => <SvgIcon><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></SvgIcon>;
export const CalendarSolidIcon = () => <SvgIcon><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17" /><path d="M8 12.5h2v2H8zM12 12.5h2v2h-2zM16 12.5h.5v2H16z" fill="currentColor" stroke="none" /></SvgIcon>;
export const ChevronDownIcon = ({ className = '' }: { className?: string }) => <SvgIcon className={className}><path d="m7 10 5 5 5-5" /></SvgIcon>;
export const InsightIcon = ({ className = '' }: { className?: string }) => <SvgIcon className={className}><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /><path d="m19 14 .9 3.1L23 18l-3.1.9L19 22l-.9-3.1L15 18l3.1-.9L19 14Z" /></SvgIcon>;
export const ShoppingBagIcon = () => <SvgIcon><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></SvgIcon>;
export const PackageIcon = () => <Icon name="package" size={14} />;
export const FoodIcon = () => <Icon name="utensils" size={14} />;
export const CarIcon = () => <Icon name="car-front" size={14} />;
export const HomeIcon = () => <Icon name="house" size={14} />;
export const ArrowCircleDownIcon = () => <Icon name="circle-arrow-down" size={16} />;
export const ArrowCircleUpIcon = () => <Icon name="circle-arrow-up" size={16} />;
export const BarLineChartIcon = () => <Icon name="chart-no-axes-combined" size={20} />;
export function ChartLegendDot({ size = 12, className = '' }: { size?: number; className?: string }) { return <span aria-hidden className={`mebius-chart-legend-dot ${className}`} style={{ width: size, height: size }} />; }
export function ChartLegendLine({ className = '' }: { className?: string }) { return <span aria-hidden className={`mebius-chart-legend-line ${className}`} />; }

type MenuState = { open: boolean; setOpen: (open: boolean) => void; value?: string; setValue?: (value: string) => void; contentId: string; trigger: React.MutableRefObject<HTMLButtonElement | null>; close: () => void };
const MenuContext = createContext<MenuState | null>(null);
function useMenu() { const value = useContext(MenuContext); if (!value) throw new Error('Chart menu item must be inside ChartMenu.'); return value; }
export function ChartMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const contentId = useId();
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [open]);
  return <MenuContext.Provider value={{ open, setOpen, value, setValue, contentId, trigger, close }}><div ref={root} className="mebius-chart-menu">{children}</div></MenuContext.Provider>;
}
export function ChartMenuTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const state = useMenu();
  const props = {
    'aria-haspopup': 'menu',
    'aria-expanded': state.open,
    'aria-controls': state.open ? state.contentId : undefined,
    'data-state': state.open ? 'open' : 'closed',
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      children.props.onClick?.(event);
      if (event.defaultPrevented) return;
      state.trigger.current = event.currentTarget;
      state.setOpen(!state.open);
    },
  };
  if (!asChild) return <button type="button" {...props}>{children}</button>;
  return React.cloneElement(children, props as any);
}
export function ChartMenuContent({ children, align = 'start' }: { children: React.ReactNode; align?: string }) {
  const { open, contentId } = useMenu();
  return open ? <div id={contentId} role="menu" className={`mebius-chart-menu-content align-${align}`}>{children}</div> : null;
}
export function ChartMenuItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  const state = useMenu();
  return <button type="button" role="menuitem" className="mebius-chart-menu-item" onClick={() => { onSelect(); state.close(); }}>{children}</button>;
}
export function ChartMenuRadioGroup({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) {
  const state = useMenu();
  state.value = value;
  state.setValue = onValueChange;
  return <div role="group" aria-label="Selezione periodo">{children}</div>;
}
export function ChartMenuRadioItem({ children, value }: { children: React.ReactNode; value: string }) {
  const state = useMenu();
  return <button type="button" role="menuitemradio" aria-checked={state.value === value} className="mebius-chart-menu-item" onClick={() => { state.setValue?.(value); state.close(); }}>{children}</button>;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const quote = (value: string | number | null | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = rows.map(row => row.map(quote).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ChartTooltipLines({ label, value, valueRef }: { label: string; value: string; valueRef?: React.Ref<HTMLSpanElement>; dividerWidth?: number }) {
  return <><span className="mebius-tooltip-label">{label}</span><span ref={valueRef} className="mebius-tooltip-value">{value}</span></>;
}
