import { animate, createTimeline } from 'animejs';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.querySelector('.dw-app')?.getAttribute('data-motion') === 'reduce'));
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media?.matches || document.querySelector('.dw-app')?.getAttribute('data-motion') === 'reduce');
    update();
    media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export function releaseStyles(...properties: string[]) {
  return (animation: any) => {
    const targets = animation?.targets || animation?.animatables?.map((item: any) => item.target) || [];
    for (const target of Array.isArray(targets) ? targets : [targets]) {
      if (!target?.style) continue;
      for (const property of properties) target.style.removeProperty(property === 'scale' || property.startsWith('translate') ? 'transform' : property);
    }
  };
}

export function useChartEntrance(root: { current: HTMLElement | null }, build: (timeline: ReturnType<typeof createTimeline>) => void | (() => void)) {
  const reduced = useReducedMotion();
  const buildRef = useRef(build);
  const started = useRef(false);
  useIsomorphicLayoutEffect(() => { buildRef.current = build; });
  useEffect(() => {
    const element = root.current;
    if (!element || reduced || started.current) return;
    let timeline: ReturnType<typeof createTimeline> | null = null;
    let after: void | (() => void);
    const start = () => {
      if (started.current) return;
      started.current = true;
      timeline = createTimeline({ autoplay: false });
      after = buildRef.current(timeline);
      timeline.play();
    };
    if (!('IntersectionObserver' in window)) start();
    else {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { start(); observer.disconnect(); }
      }, { threshold: 0.08 });
      observer.observe(element);
      return () => { observer.disconnect(); after?.(); timeline?.cancel(); };
    }
    return () => { after?.(); timeline?.cancel(); };
  }, [root, reduced]);
}

export function useCountUp(ref: { current: HTMLElement | null }, value: number, format: (value: number) => string, { duration = 800 }: { duration?: number } = {}) {
  const previous = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = previous.current;
    previous.current = value;
    if (from === value || reduced) { element.textContent = format(value); return; }
    const state = { value: from };
    const animation = animate(state, { value: [from, value], duration, ease: 'outExpo', onUpdate: () => { element.textContent = format(state.value); }, onComplete: () => { element.textContent = format(value); } });
    return () => animation.cancel();
  }, [duration, format, ref, reduced, value]);
}
