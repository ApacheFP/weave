import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('shared controls keep progress values valid and render a close icon', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { Progress, Icon, Button } = await server.ssrLoadModule('/src/dashboard/ui.jsx');
    for (const [value, expected] of [[-10, 0], [125, 100], [42.4, 42.4], [NaN, 0], [Infinity, 0]]) {
      const markup = renderToStaticMarkup(createElement(Progress, { value, label: 'Avanzamento' }));
      assert.match(markup, new RegExp(`aria-valuenow="${Math.round(expected)}"`));
      assert.ok(markup.includes(`width:${expected}%`));
    }
    const close = renderToStaticMarkup(createElement(Icon, { name: 'close' }));
    assert.match(close, /lucide-x/);
    assert.match(close, /d="M18 6 6 18"/);
    assert.doesNotMatch(close, /circle-help/);
    assert.match(renderToStaticMarkup(createElement(Button, null, 'Salva')), /type="button"/);
    assert.match(renderToStaticMarkup(createElement(Button, { type: 'submit' }, 'Salva')), /type="submit"/);
  } finally {
    await server.close();
  }
});
