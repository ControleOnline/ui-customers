const IMAGE_FILE_PATTERN = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:\?|$)/i;
const PDF_FILE_PATTERN = /\.pdf(?:\?|$)/i;

export const extractId = value => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  const raw = typeof value === 'string' ? value : value?.id || value?.['@id'] || '';
  const match = String(raw).match(/(\d+)(?:\D*)$/);
  return match ? match[1] : String(raw).replace(/\D/g, '') || '';
};

export const normalizeText = value => String(value || '').trim();

export const isImageFile = url => IMAGE_FILE_PATTERN.test(String(url || ''));
export const isPdfFile = url => PDF_FILE_PATTERN.test(String(url || ''));

export const applyDocumentMask = (value, documentType) => {
  if (!value) {
    return '';
  }
  const numbers = String(value).replace(/\D/g, '');
  const docType = String(documentType || '').toUpperCase();

  if (docType === 'CPF') {
    return numbers
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  if (docType === 'CNPJ') {
    return numbers
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  return numbers;
};

export const removeMask = value => String(value || '').replace(/\D/g, '');

export const toDocumentIri = documentId => {
  const id = extractId(documentId);
  return id ? `/documents/${id}` : '';
};

export const toFileIri = fileValue => {
  if (!fileValue) {
    return '';
  }
  if (typeof fileValue === 'string' && fileValue.startsWith('/files/')) {
    return fileValue;
  }
  const id = extractId(fileValue?.id || fileValue?.['@id'] || fileValue);
  return id ? `/files/${id}` : '';
};

export const normalizeAttachment = (attachment, resolveDownloadUrl) => {
  if (!attachment) {
    return null;
  }
  const sourceFile = attachment.file || attachment;
  const downloadUrl =
    typeof resolveDownloadUrl === 'function'
      ? resolveDownloadUrl(sourceFile)
      : sourceFile?.url || sourceFile?.downloadUrl || '';
  const fileId = extractId(
    sourceFile?.id || sourceFile?.['@id'] || sourceFile?.file_id || downloadUrl,
  );
  const name =
    normalizeText(sourceFile?.name || sourceFile?.fileName || sourceFile?.originalName) ||
    (fileId ? `arquivo-${fileId}` : 'arquivo');

  return {
    id: attachment.id || attachment['@id'] || (fileId ? `legacy-${fileId}` : ''),
    fileId,
    name,
    url: downloadUrl,
    file: sourceFile,
    legacy: Boolean(attachment.__legacy) || (!attachment.id && !attachment['@id']),
  };
};

export const normalizeDocumentFiles = (document, resolveDownloadUrl) => {
  const linkedFiles = Array.isArray(document?.documentFiles)
    ? document.documentFiles
    : Array.isArray(document?.document_files)
      ? document.document_files
      : [];

  const fromCollection = linkedFiles
    .map(item => normalizeAttachment(item, resolveDownloadUrl))
    .filter(Boolean);

  if (fromCollection.length) {
    return fromCollection;
  }

  const legacy = normalizeAttachment(
    document?.file ? { ...document.file, __legacy: true } : null,
    resolveDownloadUrl,
  );
  return legacy ? [{ ...legacy, legacy: true }] : [];
};

export const toDocumentItem = document => ({
  id: extractId(document?.id || document?.['@id']),
  value: document?.document ?? document?.value ?? '',
  type: document?.documentType?.['@id'] || document?.documentType || document?.type || '',
  files: [],
  raw: document,
});

export const unwrapUploadFile = payload => {
  const data = payload?.response?.data ?? payload?.data ?? payload;
  if (!data) {
    return null;
  }
  if (data?.file) {
    return data.file;
  }
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  if (Array.isArray(data?.member)) {
    return data.member[0] || null;
  }
  if (Array.isArray(data?.['hydra:member'])) {
    return data['hydra:member'][0] || null;
  }
  return data;
};

export const ACCEPTED_DOCUMENT_FILE_TYPES = 'image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf';
