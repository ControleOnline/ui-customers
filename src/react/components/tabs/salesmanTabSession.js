import { app_type } from '@appType';

const resolveAppType = () => {
  // MANAGER is normally defined by the build. localStorage is only populated
  // when an ADMIN build lets the user switch views, so it cannot be the source
  // of truth for regular MANAGER deployments.
  if (app_type) {
    return String(app_type).trim();
  }
  try {
    if (typeof localStorage !== 'undefined') {
      return String(localStorage.getItem('app-type') || '').trim();
    }
  } catch (_) {
    /* noop */
  }
  return '';
};

const resolveSessionUser = authStore => {
  const fromStore = authStore?.getters?.user || authStore?.state?.user;
  if (fromStore && typeof fromStore === 'object') {
    return fromStore;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('session');
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (_) {
    /* noop */
  }
  return null;
};


export { resolveAppType, resolveSessionUser };
