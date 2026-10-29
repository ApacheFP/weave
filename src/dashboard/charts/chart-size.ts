import { useEffect, useRef, useState } from 'react';

export function useChartSize<T extends HTMLElement>({ width, height }: { width: number; height: number }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      setSize(previous => previous.width === box.width && previous.height === box.height ? previous : { width: box.width, height: box.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, { width: size.width || width, height: size.height || height }] as const;
}
