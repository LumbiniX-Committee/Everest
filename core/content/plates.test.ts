import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const plates = JSON.parse(readFileSync(join(root, 'seed', 'plates.json'), 'utf8')) as Array<{
  id: string;
  image: string;
  produced: boolean;
  evidence_tier: string;
}>;
const registry = readFileSync(join(root, 'data', 'plates.ts'), 'utf8');
const historical = readFileSync(join(root, 'data', 'demo', 'historical.ts'), 'utf8');

const pilotIds = [
  'patan-durbar-square.artistic-impression',
  'changu-narayan.artistic-impression',
  'manga-hiti.artistic-impression',
];

test('every produced plate has a bundled file and static Metro registration', () => {
  for (const plate of plates.filter((item) => item.produced)) {
    assert.ok(existsSync(join(root, 'assets', 'plates', plate.image)), `${plate.id} asset missing`);
    assert.match(registry, new RegExp(`['"]${plate.id.replaceAll('.', '\\.')}['"]`), `${plate.id} not registered`);
  }
});

test('Kathmandu pilot illustrations cannot masquerade as historical photographs', () => {
  for (const id of pilotIds) {
    const plate = plates.find((item) => item.id === id);
    assert.equal(plate?.evidence_tier, 'artistic_impression');
    assert.match(registry, new RegExp(`${id.replaceAll('.', '\\.')}[\\s\\S]{0,500}artistic_impression`));
  }
});

test('Kathmandu pilot plates participate in Then/Now with unconfirmed viewpoints', () => {
  for (const id of pilotIds) {
    assert.match(historical, new RegExp(`${id.replaceAll('.', '\\.')}[\\s\\S]{0,700}viewpointConfirmed: false`));
  }
});
