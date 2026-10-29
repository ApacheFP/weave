import React, { createContext, useContext, useState } from 'react';
import { Icon } from '../ui.jsx';

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export const ChartCard = React.forwardRef<HTMLElement, React.ComponentProps<'section'>>(({ className, children, ...props }, ref) => (
  <section ref={ref} className={`dw-card mebius-chart-card ${className || ''}`} {...props}><div className="dw-card-body">{children}</div></section>
));
ChartCard.displayName = 'ChartCard';

export function ChartButton({ children, size = 'default', corner, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; corner?: string }) {
  return <button type="button" className={`mebius-chart-button ${size === 'icon' ? 'is-icon' : ''} ${corner === 'rounded' ? 'is-rounded' : ''} ${className}`} {...props}>{children}</button>;
}

export function ChartSwatch({ className = '' }: { className?: string }) { return <span aria-hidden className={`mebius-chart-swatch ${className}`} />; }

function SvgIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
export const DotsHorizontalIcon = () => <SvgIcon><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></SvgIcon>;
export const ShoppingBagIcon = () => <SvgIcon><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></SvgIcon>;
export const FoodIcon = () => <Icon name="utensils" size={14} />;
export const CarIcon = () => <Icon name="car-front" size={14} />;
export const HomeIcon = () => <Icon name="house" size={14} />;
export const ArrowCircleDownIcon = () => <Icon name="circle-arrow-down" size={16} />;
export const ArrowCircleUpIcon = () => <Icon name="circle-arrow-up" size={16} />;
export const BarLineChartIcon = () => <Icon name="chart-no-axes-combined" size={20} />;

type MenuState = { open: boolean; setOpen: (open: boolean) => void; value?: string; setValue?: (value: string) => void };
const MenuContext = createContext<MenuState | null>(null);
function useMenu() { const value = useContext(MenuContext); if (!value) throw new Error('Chart menu item must be inside ChartMenu.'); return value; }
export function ChartMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>();
  return <MenuContext.Provider value={{ open, setOpen, value, setValue }}><div className="mebius-chart-menu" onKeyDown={event => event.key === 'Escape' && setOpen(false)}>{children}</div></MenuContext.Provider>;
}
export function ChartMenuTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const { open, setOpen } = useMenu();
  if (!asChild) return <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{children}</button>;
  return React.cloneElement(children, { 'aria-expanded': open, 'data-state': open ? 'open' : 'closed', onClick: (event: React.MouseEvent) => { children.props.onClick?.(event); setOpen(!open); } } as any);
}
export function ChartMenuContent({ children, align = 'start' }: { children: React.ReactNode; align?: string }) {
  const { open } = useMenu();
  return open ? <div role="menu" className={`mebius-chart-menu-content align-${align}`}>{children}</div> : null;
}
export function ChartMenuRadioGroup({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) {
  const state = useMenu();
  state.value = value;
  state.setValue = onValueChange;
  return <div role="group" aria-label="Selezione periodo">{children}</div>;
}
export function ChartMenuRadioItem({ children, value }: { children: React.ReactNode; value: string }) {
  const { open, setOpen } = useMenu();
  const state = useMenu();
  return <button type="button" role="menuitemradio" aria-checked={state.value === value} className="mebius-chart-menu-item" onClick={() => { state.setValue?.(value); setOpen(false); }}>{children}</button>;
}

export function ChartTooltipLines({ label, value, valueRef }: { label: string; value: string; valueRef?: React.Ref<HTMLSpanElement>; dividerWidth?: number }) {
  return <><span className="mebius-tooltip-label">{label}</span><span ref={valueRef} className="mebius-tooltip-value">{value}</span></>;
}
