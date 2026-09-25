export const COMPANY_DETAILS_TAB_SCROLL_PROPS = {
  horizontal: true,
  showsHorizontalScrollIndicator: false,
};

export const COMPANY_DETAILS_TAB_LAYOUT = {
  header: { flexGrow: 0 },
  content: { flexDirection: 'row', minWidth: '100%' },
  button: { flexGrow: 1, flexShrink: 0, paddingHorizontal: 10 },
};

export const getSellersEmptyStatePresentation = canManage => ({
  actionLabel: canManage ? 'Vincular vendedor' : null,
  guidance: canManage
    ? null
    : 'Peça a um administrador para vincular um vendedor.',
});
