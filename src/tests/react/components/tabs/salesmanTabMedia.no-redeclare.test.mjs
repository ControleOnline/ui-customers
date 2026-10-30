/**
 * Regression: GIT BUILD ERROR — Identifier 'COMPANY_ICON_MEDIA_TYPES' has already been declared
 * (import from salesmanTabMedia + local const redeclaration in SalesmanTab).
 * Refs: ControleOnline/ui-customers#20
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tabsDir = path.resolve(__dirname, '../../../../react/components/tabs');
const tabSrc = fs.readFileSync(path.join(tabsDir, 'SalesmanTab.js'), 'utf8');
const mediaSrc = fs.readFileSync(path.join(tabsDir, 'salesmanTabMedia.js'), 'utf8');

assert.match(
  tabSrc,
  /from ['"]\.\/salesmanTabMedia['"]/,
  'SalesmanTab must import from ./salesmanTabMedia',
);
assert.match(tabSrc, /COMPANY_ICON_MEDIA_TYPES/, 'SalesmanTab must reference COMPANY_ICON_MEDIA_TYPES');
assert.doesNotMatch(
  tabSrc,
  /const COMPANY_ICON_MEDIA_TYPES\s*=/,
  'SalesmanTab must NOT redeclare COMPANY_ICON_MEDIA_TYPES locally (causes SyntaxError on web bundle)',
);
assert.match(
  mediaSrc,
  /export \{[^}]*COMPANY_ICON_MEDIA_TYPES/,
  'salesmanTabMedia must export COMPANY_ICON_MEDIA_TYPES',
);

console.log('ok: salesmanTabMedia single source of truth for COMPANY_ICON_MEDIA_TYPES');
