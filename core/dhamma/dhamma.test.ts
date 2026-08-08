/**
 * core/dhamma/dhamma.test.ts
 *
 * Unit tests for Dhamma Engine:
 *  - Bilara segment resolution
 *  - Hybrid RRF retrieval
 *  - Grounding gate & refusal path
 *  - Citation validator
 *  - Reflection companion & distress safety override
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSegment,
  hybridRetrieve,
  askDhamma,
  validateCitations,
  processReflection,
  checkDistressTrigger,
  VERIFIED_NEPALI_HELPLINES,
} from './index.ts';

test('bilara segment resolution', () => {
  const chunk = resolveSegment('dn16:6.7.1');
  assert.ok(chunk);
  assert.equal(chunk?.uid, 'dn16');
  assert.equal(chunk?.title_pi, 'Mahāparinibbānasutta');
});

test('hybrid RRF retrieval returns top matched chunk', () => {
  const matches = hybridRetrieve('last words of the buddha', 3);
  assert.ok(matches.length > 0);
  assert.equal(matches[0].chunk.uid, 'dn16');
  assert.ok(matches[0].rrfScore > 0);
});

test('askDhamma answers valid query with cited chunk', () => {
  const res = askDhamma({ question: 'what were the last words of the buddha' });
  assert.equal(res.refused, false);
  assert.ok(res.answer?.includes('Mahāparinibbāna Sutta'));
  assert.ok(res.citations.length > 0);
  assert.equal(res.citations[0].sutta_uid, 'dn16');
});

test('askDhamma refuses out-of-scope query', () => {
  const res = askDhamma({ question: 'what does buddhism say about cryptocurrency' });
  assert.equal(res.refused, true);
  assert.equal(res.answer, null);
  assert.ok(res.refusal_reason != null);
});

test('citation validator extracts and verifies segment IDs', () => {
  const matches = hybridRetrieve('four noble truths', 2);
  const text = 'The truth of suffering is taught in [sn56.11:4.2].';
  const verified = validateCitations(text, matches);
  assert.ok(verified.length > 0);
  assert.equal(verified[0].segment_id, 'sn56.11:4.2');
});

test('reflection companion steps through four-truths scaffold', () => {
  const step1 = processReflection({ site_id: 'tilaurakot', stage: 1 });
  assert.equal(step1.stage, 1);
  assert.equal(step1.distress_override, false);
  assert.ok(step1.inquiry.includes('Siddhartha'));

  const step4 = processReflection({ stage: 4, user_input: 'I will meditate daily' });
  assert.equal(step4.stage, 4);
  assert.equal(step4.completed, true);
});

test('safety distress override halts reflection and surfaces helplines', () => {
  assert.equal(checkDistressTrigger('I feel suicidal and hopeless'), true);
  assert.equal(checkDistressTrigger('म आत्महत्या गर्न चाहन्छु'), true);

  const crisisRes = processReflection({ stage: 2, user_input: 'I want to kill myself' });
  assert.equal(crisisRes.distress_override, true);
  assert.equal(crisisRes.completed, true);
  assert.ok(crisisRes.helplines);
  assert.equal(crisisRes.helplines?.length, VERIFIED_NEPALI_HELPLINES.length);
  assert.equal(crisisRes.helplines?.[0].number, '1660 01 20005');
});
