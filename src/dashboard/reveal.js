const groupNames = /(?:^|-)(?:grid|list|stack|rows|items|metrics|products|cards|card|body|options|group|columns|main|layout|content|container|page|section|sections|panel|block)(?:-|$)/i;

export function staggeredDelay(index, step = 65) {
  return index * step;
}

export function observePageReveals(root, shouldAnimate = () => true) {
  if (!root || typeof IntersectionObserver === 'undefined') return () => {};
  const seen = new WeakSet();
  const groups = new WeakMap();
  const nextReveal = new WeakMap();
  const observed = new Set();
  const active = new Set();
  const finish = event => {
    if (event.target !== event.currentTarget || event.animationName !== 'dw-reveal') return;
    const element = event.currentTarget;
    element.classList.remove('dw-reveal-active');
    element.style.removeProperty('--dw-reveal-delay');
    element.removeEventListener('animationend', finish);
    element.removeEventListener('animationcancel', finish);
    active.delete(element);
  };
  const observer = new IntersectionObserver(entries => {
    const ready = entries.filter(entry => entry.isIntersecting).sort((a, b) => {
      const relation = a.target.compareDocumentPosition(b.target);
      return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : relation & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
    });
    const now = performance.now();
    for (const { target } of ready) {
      const group = groups.get(target);
      if (!shouldAnimate()) {
        target.classList.remove('dw-reveal-pending');
        observer.unobserve(target);
        observed.delete(target);
        nextReveal.delete(group);
        continue;
      }
      const start = Math.max(now, nextReveal.get(group) || now);
      nextReveal.set(group, start + staggeredDelay(1));
      target.style.setProperty('--dw-reveal-delay', `${Math.round(start - now)}ms`);
      target.classList.remove('dw-reveal-pending');
      target.classList.add('dw-reveal-active');
      target.addEventListener('animationend', finish);
      target.addEventListener('animationcancel', finish);
      active.add(target);
      observer.unobserve(target);
      observed.delete(target);
    }
  }, { threshold: 0 });

  function scan() {
    const containers = [root, ...root.querySelectorAll('div,section,article,form,ul,ol,tbody')];
    for (const container of containers) {
      const isRootContent = container === root || container.parentElement === root;
      if (!isRootContent && container.tagName !== 'TBODY' && container.tagName !== 'UL' && container.tagName !== 'OL' && ![...container.classList].some(name => groupNames.test(name))) continue;
      const interactive = container.closest('button, select, textarea, [role="dialog"]');
      if (interactive && root.contains(interactive)) continue;
      const children = [...container.children].filter(child => !child.matches('script,style,svg,template,[hidden]'));
      if (children.length < 2) continue;
      for (const child of children) {
        if (seen.has(child) || child.contains(document.activeElement)) continue;
        seen.add(child);
        groups.set(child, container);
        child.classList.add('dw-reveal-pending');
        observed.add(child);
        observer.observe(child);
      }
    }
  }

  scan();
  const mutations = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1))) scan();
  });
  mutations.observe(root, { childList: true, subtree: true });
  return () => {
    mutations.disconnect();
    observer.disconnect();
    for (const element of observed) element.classList.remove('dw-reveal-pending');
    for (const element of active) {
      element.classList.remove('dw-reveal-active');
      element.style.removeProperty('--dw-reveal-delay');
      element.removeEventListener('animationend', finish);
      element.removeEventListener('animationcancel', finish);
    }
  };
}
