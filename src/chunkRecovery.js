const retryKey = 'weave:chunk-retry-at';
const retryStateKey = 'weaveChunkRetryAt';
const retryCooldown = 15_000;

export function installChunkRecovery(browserWindow, now = Date.now) {
  const recover = event => {
    const currentTime = now();
    try {
      const stored = browserWindow.sessionStorage.getItem(retryKey);
      const lastRetry = Number(stored);
      if (stored !== null && Number.isFinite(lastRetry) && currentTime - lastRetry < retryCooldown) return;
      browserWindow.sessionStorage.setItem(retryKey, String(currentTime));
    } catch {
      try {
        const state = browserWindow.history.state;
        const lastRetry = Number(state?.[retryStateKey]);
        if (Number.isFinite(lastRetry) && currentTime - lastRetry < retryCooldown) return;
        const safeState = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
        browserWindow.history.replaceState({ ...safeState, [retryStateKey]: currentTime }, '', browserWindow.location.href);
      } catch {
        return;
      }
    }

    event.preventDefault();
    browserWindow.location.reload();
  };

  browserWindow.addEventListener('vite:preloadError', recover);
  return () => browserWindow.removeEventListener('vite:preloadError', recover);
}
