const resolveAppType = () => {
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
