const retryKey = 'weave:chunk-retry-at';
const retryCooldown = 15_000;

export function installChunkRecovery(browserWindow, now = Date.now) {
  const recover = event => {
    try {
      const stored = browserWindow.sessionStorage.getItem(retryKey);
      const lastRetry = Number(stored);
      if (stored !== null && Number.isFinite(lastRetry) && now() - lastRetry < retryCooldown) return;
      browserWindow.sessionStorage.setItem(retryKey, String(now()));
    } catch {
      return;
    }

    event.preventDefault();
    browserWindow.location.reload();
  };

  browserWindow.addEventListener('vite:preloadError', recover);
  return () => browserWindow.removeEventListener('vite:preloadError', recover);
}
