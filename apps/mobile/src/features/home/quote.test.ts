import { headingSpacing, quoted } from './quote';

describe('quoted', () => {
  it('wraps in curly quotes once, whatever the text already carries', () => {
    expect(quoted('Have I not commanded you?')).toBe('“Have I not commanded you?”');
    expect(quoted('“Have I not commanded you?”')).toBe('“Have I not commanded you?”');
    expect(quoted('"Do not be afraid." ')).toBe('“Do not be afraid.”');
    expect(quoted('నేను నీకు తోడైయుండును.')).toBe('“నేను నీకు తోడైయుండును.”');
  });
});

describe('headingSpacing', () => {
  it('spaces Latin headings but not Telugu ones', () => {
    expect(headingSpacing('DAILY BREAD')).toBe(2.5);
    expect(headingSpacing('అనుదిన ఆహారం')).toBe(0);
  });
});
