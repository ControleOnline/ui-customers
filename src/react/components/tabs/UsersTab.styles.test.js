/**
 * Regression: Salvar button must be a visible primary action (not text-only styles).
 * Root cause of app-community#458 / #635: after task-428 modularization,
 * inlineStyle_348_20 kept Cancelar text styles and was applied to the Salvar
 * TouchableOpacity → white label on white modal made Salvar invisible.
 */
import {
  inlineStyle_339_16,
  inlineStyle_341_14,
  inlineStyle_348_20,
  timezoneListStyle,
} from './UsersTab.styles';

describe('UsersTab.styles — UserFormModal footer / Salvar visibility (#635)', () => {
  it('footer row has padding and top border so actions stay visible', () => {
    expect(inlineStyle_339_16.paddingHorizontal).toBe(24);
    expect(inlineStyle_339_16.paddingBottom).toBe(24);
    expect(inlineStyle_339_16.borderTopWidth).toBe(1);
  });

  it('Cancelar keeps outlined secondary style', () => {
    expect(inlineStyle_341_14.flex).toBe(1);
    expect(inlineStyle_341_14.borderWidth).toBe(1);
    expect(inlineStyle_341_14.borderColor).toBe('#64748B');
  });

  it('Salvar is primary button with solid background (not text-only styles)', () => {
    expect(inlineStyle_348_20.flex).toBe(1);
    expect(inlineStyle_348_20.backgroundColor).toBe('#0F172A');
    expect(inlineStyle_348_20.paddingVertical).toBe(14);
    expect(inlineStyle_348_20.borderRadius).toBe(12);
    expect(inlineStyle_348_20.alignItems).toBe('center');
    // must NOT be the old text-only shape
    expect(inlineStyle_348_20.fontSize).toBeUndefined();
    expect(inlineStyle_348_20.color).toBeUndefined();
  });

  it('timezone list is height-capped so long lists do not push footer off-screen', () => {
    expect(timezoneListStyle.maxHeight).toBe(220);
    expect(timezoneListStyle.overflow).toBe('hidden');
  });
});
