const {
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

function applyOptionsToSubcommand(sub, options = []) {
  for (const opt of options) {
    const base = builder =>
      builder
        .setName(opt.name)
        .setDescription(opt.description || 'No description')
        .setRequired(!!opt.required);

    switch (opt.type) {
    case 'integer':
      sub.addIntegerOption(o => {
        let b = base(o);
        if (opt.autocomplete) b = b.setAutocomplete(true);
        if (opt.choices?.length) b = b.addChoices(...opt.choices);
        return b;
      });
      break;
    case 'boolean':
      sub.addBooleanOption(o => base(o));
      break;
    case 'user':
      sub.addUserOption(o => base(o));
      break;
    case 'role':
      sub.addRoleOption(o => base(o));
      break;
    case 'channel':
      sub.addChannelOption(o => base(o));
      break;
    case 'string':
    default:
      sub.addStringOption(o => {
        let b = base(o);
        if (opt.autocomplete) b = b.setAutocomplete(true);
        if (opt.choices?.length) b = b.addChoices(...opt.choices);
        return b;
      });
      break;
    }
  }
}

class SlashCommandRegistrar {
  constructor(config, registry, logger) {
    this.config = config;
    this.registry = registry;
    this.logger = logger;
  }

  async registerCommands() {
    const groups = this.registry.listByGroup();
    const slashDefs = [];

    for (const [group, commands] of groups.entries()) {
      const builder = new SlashCommandBuilder()
        .setName(group)
        .setDescription(`${group} commands`);

      for (const cmd of commands) {
        builder.addSubcommand(sub =>
          sub
            .setName(cmd.name)
            .setDescription(cmd.description || 'No description')
        );
        const subDef = builder.options.at(-1);
        applyOptionsToSubcommand(subDef, cmd.options);
      }

      slashDefs.push(builder.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(this.config.DISCORD_TOKEN);

    this.logger.info('Registering global slash commands…');

    await rest.put(
      Routes.applicationCommands(this.config.DISCORD_CLIENT_ID),
      { body: slashDefs }
    );

    this.logger.info('Slash commands registered.');
  }
}

module.exports = SlashCommandRegistrar;
