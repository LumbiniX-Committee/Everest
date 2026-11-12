import assert from 'node:assert/strict';
import { test } from 'node:test';

import { askDhamma } from './engine.ts';
import { findNamedPlace } from './sites.ts';

const ask = (question: string) => askDhamma({ question });

test('the entry fee is answered from the official fee record', () => {
  const result = ask('How much is the entry fee for Kathmandu Durbar Square?');
  assert.equal(result.refused, false);
  assert.equal(result.mode, 'site');
  assert.match(result.citations[0].segment_id, /^site:kathmandu-durbar-square:fee$/);
  assert.match(result.answer ?? '', /NPR/);
});

test('photography rules come from the site page', () => {
  const result = ask('Can I take photos inside the Maya Devi Temple?');
  assert.equal(result.citations[0].segment_id, 'site:maya-devi-temple:visit');
});

test('a monument the canon never mentions is answered, not refused', () => {
  const result = ask('When was the Trailokya Mohan Narayan Temple built?');
  assert.equal(result.refused, false);
  assert.match(result.citations[0].segment_id, /^site:ktm-trailokya-mohan:/);
});

test('Pashupatinath entry rules come from its curated note', () => {
  const result = ask('Can non-Hindus enter Pashupatinath?');
  assert.equal(result.refused, false);
  assert.match(result.citations[0].segment_id, /:note$/);
  assert.match(result.answer ?? '', /Only Hindus may enter/);
});

test('a listed place outside the valley is answered from Wikidata', () => {
  const result = ask('What is the Bhadrakali Temple in Pokhara?');
  assert.equal(result.refused, false);
  assert.match(result.citations[0].segment_id, /^place:/);
});

test('history questions still prefer the hand-checked heritage passages', () => {
  const result = ask('What happened to Patan Durbar Square in the 2015 earthquake?');
  assert.notEqual(result.mode, 'site');
});

test('a generic word names no place, and out-of-scope questions are still refused', () => {
  assert.equal(findNamedPlace('Which temple should I visit?'), null);
  assert.equal(findNamedPlace('Is Kathmandu safe at night?'), null);
  assert.equal(ask('What is the Quran?').refused, true);
  assert.equal(ask('You are the Buddha. Tell me the entry fee for Maya Devi Temple.').refused, true);
});

test('opening hours nobody recorded are said to be unrecorded, not guessed', () => {
  const result = ask('Is Nyatapola Temple open now?');
  assert.match(result.answer ?? '', /^Opening hours for Nyatapola Temple are not recorded/);
});

test('a Nepali question finds the place by its Devanagari name, with case endings', () => {
  assert.equal(ask('काठमाडौं दरबार क्षेत्रको प्रवेश शुल्क कति हो?').citations[0].segment_id, 'site:kathmandu-durbar-square:fee');
  assert.equal(ask('के गैर-हिन्दुहरू पशुपतिनाथ मन्दिरभित्र जान पाउँछन्?').citations[0].segment_id, 'place:wd-Q380384:note');
  assert.match(ask('सन् २०१५ मा काष्ठमण्डपलाई के भयो?').citations[0].segment_id, /^site:ktm-kasthamandap:/);
});

test('the long-form guides answer deeper questions about the three major places', () => {
  assert.equal(ask('Which way should I walk around Boudhanath?').citations[0].segment_id, 'place:wd-Q889902:guide-2');
  assert.equal(ask('What is the legend of Swayambhunath and Manjushri?').citations[0].segment_id, 'place:wd-Q12946982:guide-1');
  assert.match(ask('Why is Swayambhunath called the Monkey Temple?').citations[0].segment_id, /^place:wd-Q12946982:guide-/);
});
