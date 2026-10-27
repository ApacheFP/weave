export function splitMentions(text, names) {
  const escaped = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return [text];
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}._%+-])(@(?:${escaped.join('|')}))(?![\\p{L}\\p{N}_])`, 'giu');
  return text.split(pattern);
}

export function demoMentionBody(item, profileName) {
  if (item.demo && item.type === 'mention' && item.id.startsWith('inbox-quality-') && profileName && /^\d+ capi da ricontrollare sul lotto [^\s]+\. /.test(item.body)) {
    return `@${profileName} ${item.body}`;
  }
  return item.body;
}
