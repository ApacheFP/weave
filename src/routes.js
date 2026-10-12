// URLs are explicit contracts; changing a label must not change a bookmark.
export const moduleSlugs = {
  1: 'ideazione', 2: 'disegno-tecnico', 3: 'materiali', 4: 'modellistica',
  5: 'sviluppo-taglie', 6: 'prototipi', 7: 'piazzamento', 9: 'costi-e-pricing',
  10: 'pianificazione', 11: 'acquisti', 12: 'produzione', 13: 'qualita',
  19: 'passaporto-digitale', 21: 'panoramica-capo', 22: 'assistente',
};
export const pagePaths = {
  home: '/atelier', inbox: '/atelier/inbox', 'my-tasks': '/atelier/le-mie-attivita',
  notifications: '/atelier/notifiche', capi: '/atelier/capi', activity: '/atelier/attivita',
  settings: '/atelier/impostazioni', profile: '/atelier/profilo',
};
export const settingsSlugs = {
  workspace: 'spazio-di-lavoro', appearance: 'aspetto', language: 'lingua', datetime: 'data-e-ora',
  members: 'membri', teams: 'team', projects: 'capi', permissions: 'permessi',
  email: 'email', push: 'push', mentions: 'menzioni', assignments: 'assegnazioni',
  profile: 'profilo', preferences: 'preferenze', shortcuts: 'scorciatoie',
  password: 'password', sessions: 'sessioni', 'two-factor': 'autenticazione-a-due-fattori',
  plan: 'piano', payment: 'pagamento', invoices: 'fatture',
};
export const explorePath = '/esplora';
export function modulePath(id) {
  if (!Object.hasOwn(moduleSlugs, id)) throw new Error('Modulo non disponibile.');
  return `/atelier/${moduleSlugs[id]}`;
}
export function pagePath(target) {
  const [page, query] = target.split('?');
  if (!Object.hasOwn(pagePaths, page)) throw new Error('Pagina non disponibile.');
  const params = new URLSearchParams(query);
  if (page === 'settings') {
    const section = params.get('section') || 'appearance';
    const key = section === 'notifications' ? 'email' : section;
    if (!Object.hasOwn(settingsSlugs, key)) throw new Error('Sezione non disponibile.');
    const slug = settingsSlugs[key];
    return `${pagePaths.settings}/${slug}`;
  }
  const message = page === 'inbox' && params.get('message');
  return pagePaths[page] + (message ? `/${encodeURIComponent(message)}` : '');
}
const workspaceRoute = (page, path, details = {}) => ({ kind: 'workspace', moduleId: 21, page, path, ...details });
const moduleRoute = id => ({ kind: 'module', moduleId: id, page: null, path: modulePath(id) });
const notFound = path => ({ kind: 'not-found', path });

export function resolveRoute({ pathname = '/', search = '', hash = '' }) {
  const legacyHash = hash.startsWith('#/');
  const [rawPath, hashQuery] = legacyHash ? hash.slice(1).split('?') : [pathname, null];
  const path = rawPath.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  const params = new URLSearchParams(legacyHash ? hashQuery : search);
  const lower = path.toLowerCase();
  if (['/', '/moduli', explorePath].includes(lower)) return { kind: 'explore', path: explorePath };
  const legacyModule = lower.match(/^\/moduli\/(\d+)$/);
  if (legacyModule) return Object.hasOwn(moduleSlugs, Number(legacyModule[1])) ? moduleRoute(Number(legacyModule[1])) : notFound(path);
  const module = Object.entries(moduleSlugs).find(([, slug]) => lower === `/atelier/${slug}`);
  if (module) return moduleRoute(Number(module[0]));
  const settings = lower.match(/^\/atelier\/impostazioni(?:\/([^/]+))?$/);
  if (settings) {
    const requested = params.get('section') || 'appearance';
    const section = settings[1] ? Object.keys(settingsSlugs).find(key => settingsSlugs[key] === settings[1]) : requested === 'notifications' ? 'email' : requested;
    return Object.hasOwn(settingsSlugs, section) ? workspaceRoute('settings', pagePath(`settings?section=${section}`), { settingsSection: section }) : notFound(path);
  }
  const inbox = path.match(/^\/atelier\/inbox\/([^/]+)$/i);
  if (inbox) {
    try {
      const inboxId = decodeURIComponent(inbox[1]);
      return workspaceRoute('inbox', pagePath(`inbox?message=${encodeURIComponent(inboxId)}`), { inboxId });
    } catch { return notFound(path); }
  }
  const page = Object.keys(pagePaths).find(key => lower === pagePaths[key] || lower === `/${key}`);
  if (page) {
    const section = params.get('section') || 'appearance';
    const settingsSection = section === 'notifications' ? 'email' : section;
    if (page === 'settings' && !Object.hasOwn(settingsSlugs, settingsSection)) return notFound(path);
    const inboxId = page === 'inbox' ? params.get('message') : null;
    const query = page === 'settings' ? `?section=${settingsSection}` : inboxId ? `?message=${encodeURIComponent(inboxId)}` : '';
    return workspaceRoute(page, pagePath(page + query), { inboxId, ...(page === 'settings' && { settingsSection }) });
  }
  return notFound(path);
}

export function readCurrentRoute() {
  const route = resolveRoute(window.location);
  if (route.kind !== 'not-found') {
    const fragment = window.location.hash.startsWith('#/') ? '' : window.location.hash;
    const canonical = route.path + fragment;
    if (window.location.pathname + window.location.search + window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }
  return route;
}
export function navigateTo(path, { replace = false } = {}) {
  if (window.location.pathname + window.location.search + window.location.hash === path) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new Event('popstate'));
}
