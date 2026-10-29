import { useCallback, useState } from 'react';

export function useControllableState<T>({ value, defaultValue, onChange }: { value?: T; defaultValue: T; onChange?: (value: T) => void }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value === undefined ? uncontrolled : value;
  const set = useCallback((next: T) => {
    if (value === undefined) setUncontrolled(next);
    if (!Object.is(current, next)) onChange?.(next);
  }, [current, onChange, value]);
  return [current, set] as const;
}
