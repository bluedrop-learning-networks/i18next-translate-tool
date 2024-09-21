describe('translation-tool', () => {
  it('should run without errors', async () => {
    await expect(import('./index')).resolves.not.toThrow();
  });
});
