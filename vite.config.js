import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { icons as lucide } from 'lucide';
import tailwindcss from '@tailwindcss/vite';

function lucideSubset() {
  const id = 'virtual:icons';
  const resolved = `\0${id}`;
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[jt]sx?$/.test(entry.name) ? [file] : [];
  });
  const pascal = name => name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  return {
    name: 'lucide-subset',
    resolveId: source => source === id ? resolved : null,
    load(source) {
      if (source !== resolved) return null;
      const text = walk(path.resolve('src')).map(file => fs.readFileSync(file, 'utf8')).join('\n');
      const names = [...new Set([...text.matchAll(/['"`]([a-z][a-z0-9]*(?:-[a-z0-9]+)*)['"`]/g)].map(match => match[1]))].filter(name => lucide[pascal(name)]).sort();
      const icons = Object.fromEntries(names.map(name => {
        let nodes = lucide[pascal(name)];
        if (nodes[0] === 'svg') nodes = nodes[2];
        return [name, nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([key]) => key !== 'key').map(([key, value]) => `${key}="${value}"`).join(' ')}/>`).join('')];
      }));
      return `export const ICONS = ${JSON.stringify(icons)};`;
    },
  };
}

export default defineConfig({ plugins: [tailwindcss(), lucideSubset()] });
