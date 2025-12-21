const DiscordParserResponder = require('../../../../src/infra/discord/DiscordParserResponder');

describe('DiscordParserResponder', () => {
  it('should export an empty object', () => {
    expect(DiscordParserResponder).toBeDefined();
    expect(typeof DiscordParserResponder).toBe('object');
  });

  it('should have no properties', () => {
    expect(Object.keys(DiscordParserResponder)).toHaveLength(0);
  });

  it('should be empty module object', () => {
    expect(JSON.stringify(DiscordParserResponder)).toBe('{}');
  });
});
