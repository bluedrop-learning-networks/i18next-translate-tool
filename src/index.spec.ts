describe('translation-tool', () => {
  it('should run without errors', async () => {
    expect(import('./index')).resolves.not.toThrow();
  });
});
