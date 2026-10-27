import test from 'node:test';
import assert from 'node:assert/strict';
import { demoMentionBody, splitMentions } from '../src/dashboard/mentions.js';

test('highlights known mentions without treating email addresses or partial names as mentions', () => {
  const names = ['Alex Rossi', 'Alex', 'Giulia Neri'];
  assert.deepEqual(splitMentions('Ciao @Alex Rossi, scrivi a x@Alex Rossi e @Giulia Neri!', names), ['Ciao ', '@Alex Rossi', ', scrivi a x@Alex Rossi e ', '@Giulia Neri', '!']);
  assert.deepEqual(splitMentions('Nessuna menzione @Alexandra', names), ['Nessuna menzione @Alexandra']);
});

test('shows the recipient in old seeded demo mentions while leaving other messages untouched', () => {
  const item = { id: 'inbox-quality-MG-0425', type: 'mention', demo: true, body: '5 capi da ricontrollare sul lotto L-1. Verifica il polso.' };
  assert.equal(demoMentionBody(item, 'Alex Rossi'), '@Alex Rossi 5 capi da ricontrollare sul lotto L-1. Verifica il polso.');
  assert.equal(demoMentionBody({ ...item, demo: false }, 'Alex Rossi'), item.body);
  assert.equal(demoMentionBody({ ...item, body: '@Alex Rossi Controlla.' }, 'Alex Rossi'), '@Alex Rossi Controlla.');
});
