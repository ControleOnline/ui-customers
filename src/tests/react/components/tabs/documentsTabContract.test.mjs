import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const tab = fs.readFileSync(
  new URL('../../../../react/components/tabs/DocumentsTab.js', import.meta.url),
  'utf8',
);
const attachments = fs.readFileSync(
  new URL('../../../../react/components/tabs/DocumentAttachments.js', import.meta.url),
  'utf8',
);
const helpers = fs.readFileSync(
  new URL('../../../../react/components/tabs/documentsTabHelpers.js', import.meta.url),
  'utf8',
);

test('DocumentsTab wires DocumentAttachments for per-document files', () => {
  assert.match(tab, /DocumentAttachments/);
  assert.match(tab, /onFilesChanged=\{updateDocumentFiles\}/);
  assert.ok(tab.split('\n').length <= 500, 'DocumentsTab must stay under 500 lines');
});

test('DocumentAttachments exposes view/share/print/remove via DefaultUpload', () => {
  assert.match(attachments, /DefaultUpload/);
  assert.match(attachments, /relationStoreName=\"document_file\"/);
  assert.match(attachments, /handleShare|Share\.share/);
  assert.match(attachments, /handlePrint|print\(/);
  assert.match(attachments, /ACCEPTED_DOCUMENT_FILE_TYPES/);
  assert.ok(attachments.split('\n').length <= 500, 'DocumentAttachments must stay under 500 lines');
});

test('helpers cover multi-file normalization contract', () => {
  assert.match(helpers, /normalizeDocumentFiles/);
  assert.match(helpers, /documentFiles/);
  assert.match(helpers, /ACCEPTED_DOCUMENT_FILE_TYPES/);
});
