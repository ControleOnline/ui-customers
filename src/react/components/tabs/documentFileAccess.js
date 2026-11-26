import {Platform} from 'react-native';
import {File as ExpoFile, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {env as APP_ENV} from '@env';
import {api} from '@controleonline/ui-common/src/api';
import {resolveDefaultFileSource} from '@controleonline/ui-common/src/react/utils/fileUrl';
import {isTrustedApiUrl} from '@controleonline/ui-common/src/utils/trustedApiUrl';
import {resolveAttachmentKind} from './documentsTabHelpers';
import {readStoredSessionToken} from '@controleonline/ui-common/src/utils/storedSessionToken';

// app-community#1411: uploaded documents are private (public=false), so
// /files/{id}/download answers "Access denied" unless API-TOKEN is sent. Browsers
// (window.open, <img>) and Linking cannot add headers, so the file is fetched
// with the session token and handed over as a blob URL (web) or cache file (native).

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

const safeFileName = (name, fallback) =>
  String(name || fallback || 'arquivo')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim() || 'arquivo';

const readErrorMessage = async response => {
  const fallback = 'Não foi possível baixar o arquivo.';
  try {
    const parsed = JSON.parse(await response.text());
    return (
      parsed?.response?.error ||
      parsed?.['hydra:description'] ||
      parsed?.description ||
      parsed?.message ||
      fallback
    );
  } catch {
    return fallback;
  }
};

export const fetchAttachmentBlob = async attachment => {
  const source =
    resolveDefaultFileSource(attachment?.url) ||
    resolveDefaultFileSource(attachment?.file);
  if (!source?.uri) {
    throw new Error('URL do arquivo indisponível.');
  }
  // Credentials only go to the configured API, never to another origin.
  const token = isTrustedApiUrl(source.uri, APP_ENV?.API_ENTRYPOINT)
    ? (await api.getToken?.()) || readStoredSessionToken()
    : '';
  const response = await fetch(source.uri, {
    method: 'GET',
    headers: {
      ...(source.headers || {}),
      ...(token ? {'API-TOKEN': token} : {}),
      Accept: '*/*',
    },
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.blob();
};

// Returns {uri, mimeType, name}; uri is a blob: URL on web and a file:// URI on native.
export const materializeAttachment = async attachment => {
  const blob = await fetchAttachmentBlob(attachment);
  const name = safeFileName(attachment?.name, `arquivo-${attachment?.fileId || ''}`);
  const mimeType = blob.type || '';
  if (isWeb) {
    return {uri: URL.createObjectURL(blob), mimeType, name, blob};
  }
  const file = new ExpoFile(Paths.cache, `${attachment?.fileId || Date.now()}-${name}`);
  file.create({intermediates: true, overwrite: true});
  file.write(new Uint8Array(await blob.arrayBuffer()));
  return {uri: file.uri, mimeType, name, blob};
};

export const releaseAttachment = materialized => {
  if (isWeb && materialized?.uri?.startsWith('blob:')) {
    URL.revokeObjectURL(materialized.uri);
  }
};

const downloadOnWeb = ({uri, name}) => {
  const anchor = document.createElement('a');
  anchor.href = uri;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const shareNative = materialized =>
  Sharing.isAvailableAsync().then(available => {
    if (!available) {
      throw new Error('Compartilhamento indisponível neste dispositivo.');
    }
    return Sharing.shareAsync(materialized.uri, {
      mimeType: materialized.mimeType || undefined,
      dialogTitle: materialized.name,
    });
  });

// The blank tab must be opened synchronously inside the click handler, otherwise
// popup blockers reject it once the async fetch finishes.
const openBlankTab = () => {
  const tab = isWeb ? window.open('', '_blank') : null;
  if (tab) tab.opener = null;
  return tab;
};

// A blob: URL shares the app origin, so only inert types may render in a tab;
// anything else (html, svg, ...) is downloaded instead of executed.
const isSafeToRender = ({mimeType, name}) => {
  const mime = String(mimeType || '').toLowerCase();
  if (mime === 'image/svg+xml' || /\.svg$/i.test(name || '')) return false;
  return resolveAttachmentKind(name, mime) !== 'other' &&
    (mime === 'application/pdf' || mime.startsWith('image/'));
};

const showInTab = (tab, materialized, {print = false} = {}) => {
  if (!tab || !isSafeToRender(materialized)) {
    tab?.close?.();
    downloadOnWeb(materialized);
    setTimeout(() => releaseAttachment(materialized), 10000);
    return;
  }
  tab.location.href = materialized.uri;
  if (print) {
    tab.onload = () => {
      try {
        tab.focus();
        tab.print();
      } catch {
        /* the browser may block auto-print; the user can print manually */
      }
    };
  }
  setTimeout(() => releaseAttachment(materialized), 120000);
};

export const openAttachment = async (attachment, options = {}) => {
  const tab = openBlankTab();
  try {
    const materialized = await materializeAttachment(attachment);
    if (isWeb) {
      showInTab(tab, materialized, options);
      return;
    }
    await shareNative(materialized);
  } catch (error) {
    tab?.close?.();
    throw error;
  }
};

export const printAttachment = attachment => openAttachment(attachment, {print: true});

export const shareAttachment = async attachment => {
  const materialized = await materializeAttachment(attachment);
  if (!isWeb) {
    await shareNative(materialized);
    return;
  }
  const webFile = new File([materialized.blob], materialized.name, {
    type: materialized.mimeType,
  });
  if (navigator.canShare?.({files: [webFile]})) {
    try {
      await navigator.share({files: [webFile], title: materialized.name});
      releaseAttachment(materialized);
      return;
    } catch (error) {
      if (error?.name === 'AbortError') {
        releaseAttachment(materialized);
        return;
      }
    }
  }
  downloadOnWeb(materialized);
  setTimeout(() => releaseAttachment(materialized), 10000);
};
