const SlashCommandRegistrar = require('../../../../src/infra/discord/SlashCommandRegistrar');

describe('SlashCommandRegistrar', () => {
  it('should export SlashCommandRegistrar class', () => {
    expect(SlashCommandRegistrar).toBeDefined();
  });

  it('should be constructable', () => {
    const mockClient = {};

    expect(() => {
      new SlashCommandRegistrar(mockClient);
    }).not.toThrow();
  });
});
