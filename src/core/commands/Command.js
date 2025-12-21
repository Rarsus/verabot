class Command {
  constructor({ name, source, userId, channelId, args, metadata = {} }) {
    this.name = name;
    this.source = source;
    this.userId = userId || null;
    this.channelId = channelId || null;
    this.args = args || [];
    this.metadata = metadata;
  }
}

module.exports = Command;
