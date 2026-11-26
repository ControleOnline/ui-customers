/**
 * Guards the UserFormModal footer styles so the Salvar button stays visible.
 * Regression: task-428 left inlineStyle_348_20 as text-only styles (no bg/padding),
 * making the primary action invisible on a white modal (app-community#458).
 */
const styles = require('../../../../react/components/tabs/UsersTab.styles');

describe('UsersTab.styles — UserFormModal footer', () => {
  test('inlineStyle_348_20 is a primary action button (visible Salvar)', () => {
    const s = styles.inlineStyle_348_20;
    expect(s).toBeDefined();
    expect(s.backgroundColor).toBeTruthy();
    expect(String(s.backgroundColor).toLowerCase()).not.toBe('#ffffff');
    expect(s.flex).toBe(1);
    expect(s.paddingVertical).toBeGreaterThanOrEqual(12);
    expect(s.borderRadius).toBeGreaterThanOrEqual(8);
    expect(s.alignItems).toBe('center');
  });

  test('inlineStyle_341_14 is a secondary Cancelar button', () => {
    const s = styles.inlineStyle_341_14;
    expect(s.flex).toBe(1);
    expect(s.borderWidth).toBe(1);
    expect(s.paddingVertical).toBeGreaterThanOrEqual(12);
  });

  test('inlineStyle_339_16 footer row has horizontal and bottom padding', () => {
    const s = styles.inlineStyle_339_16;
    expect(s.flexDirection).toBe('row');
    expect(s.paddingHorizontal).toBeGreaterThanOrEqual(16);
    expect(s.paddingBottom).toBeGreaterThanOrEqual(16);
  });

  test('timezoneListStyle caps height so footer is not pushed off-screen', () => {
    const s = styles.timezoneListStyle;
    expect(s.maxHeight).toBeDefined();
    expect(Number(s.maxHeight)).toBeGreaterThan(0);
  });
});
