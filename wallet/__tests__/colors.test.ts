import Colors from '../src/constants/Colors';

describe('theme primary color', () => {
  it('uses #615fff as the primary tint and accent in both themes', () => {
    expect(Colors.light.tint).toBe('#615fff');
    expect(Colors.light.purple[100]).toBe('#615fff');
    expect(Colors.dark.purple[100]).toBe('#615fff');
  });
});
