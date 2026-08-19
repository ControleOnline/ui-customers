import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyDocumentMask,
  extractId,
  isImageFile,
  isPdfFile,
  normalizeDocumentFiles,
  removeMask,
  toDocumentIri,
  toFileIri,
  toDocumentItem,
  unwrapUploadFile,
} from '../../../../react/components/tabs/documentsTabHelpers.js';

test('extractId resolves numeric, string and IRI values', () => {
  assert.equal(extractId(12), '12');
  assert.equal(extractId('/documents/45'), '45');
  assert.equal(extractId({ '@id': '/files/9', id: 9 }), '9');
  assert.equal(extractId(null), '');
});

test('applyDocumentMask formats CPF and CNPJ', () => {
  assert.equal(applyDocumentMask('12345678901', 'CPF'), '123.456.789-01');
  assert.equal(applyDocumentMask('12345678000199', 'CNPJ'), '12.345.678/0001-99');
});

test('removeMask strips non-digits', () => {
  assert.equal(removeMask('12.345.678/0001-99'), '12345678000199');
});

test('file type helpers detect image and pdf urls', () => {
  assert.equal(isImageFile('https://cdn.example/file.PNG'), true);
  assert.equal(isPdfFile('https://cdn.example/doc.pdf'), true);
  assert.equal(isPdfFile('https://cdn.example/doc.png'), false);
});

test('IRI helpers build resource paths', () => {
  assert.equal(toDocumentIri(15), '/documents/15');
  assert.equal(toFileIri({ id: 3 }), '/files/3');
  assert.equal(toFileIri('/files/8'), '/files/8');
});

test('normalizeDocumentFiles prefers documentFiles collection over legacy file', () => {
  const resolveUrl = file => file?.url || '';
  const document = {
    id: 1,
    document: '123',
    documentType: { '@id': '/document_types/1', documentType: 'CNPJ' },
    file: { id: 99, url: 'https://cdn.example/legacy.pdf' },
    documentFiles: [
      {
        id: 10,
        file: { id: 20, name: 'cartao-cnpj.png', url: 'https://cdn.example/cartao.png' },
      },
      {
        id: 11,
        file: { id: 21, name: 'contrato.pdf', url: 'https://cdn.example/contrato.pdf' },
      },
    ],
  };

  const files = normalizeDocumentFiles(document, resolveUrl);
  assert.equal(files.length, 2);
  assert.equal(files[0].name, 'cartao-cnpj.png');
  assert.equal(files[1].name, 'contrato.pdf');
  assert.equal(files[0].legacy, false);

  const legacyOnly = normalizeDocumentFiles(
    { file: { id: 5, name: 'rg.jpg', url: 'https://cdn.example/rg.jpg' } },
    resolveUrl,
  );
  assert.equal(legacyOnly.length, 1);
  assert.equal(legacyOnly[0].legacy, true);
});

test('toDocumentItem maps API payload', () => {
  const item = toDocumentItem({
    '@id': '/documents/7',
    id: 7,
    document: '999',
    documentType: { '@id': '/document_types/2' },
  });
  assert.equal(item.id, '7');
  assert.equal(item.value, '999');
  assert.equal(item.type, '/document_types/2');
});

test('unwrapUploadFile accepts hydra and nested shapes', () => {
  assert.deepEqual(unwrapUploadFile({ file: { id: 1 } }), { id: 1 });
  assert.deepEqual(unwrapUploadFile({ 'hydra:member': [{ id: 2 }] }), { id: 2 });
  assert.deepEqual(unwrapUploadFile({ member: [{ id: 3 }] }), { id: 3 });
});
