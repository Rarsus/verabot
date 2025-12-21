const {
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

/**
 * Helper function to apply command options to a slash subcommand
 * Converts generic option definitions into Discord.js option builders
 * @param {Subcommand} sub - Discord.js subcommand object
 * @param {Array<Object>} options - Array of option definitions
 * @param {string} options[].name - Option name
 * @param {string} options[].type - Option type (string, integer, boolean, user, role, channel)
 * @param {string} options[].description - Option description
 * @param {boolean} options[].required - Whether option is required
 * @param {boolean} options[].autocomplete - Whether option supports autocomplete
 * @param {Array<Object>} options[].choices - Predefined choices for option
 * @returns {void}
 * @private
 */
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

/**
 * Registrar for Discord slash commands
 * Converts command registry into Discord.js slash command definitions and registers with Discord API
 * @class SlashCommandRegistrar
 * @example
 * const registrar = new SlashCommandRegistrar(config, registry, logger);
 * await registrar.registerCommands();
 */
class SlashCommandRegistrar {
  /**
   * Create a new SlashCommandRegistrar instance
   * @param {Object} config - Application configuration with DISCORD_TOKEN and DISCORD_CLIENT_ID
   * @param {CommandRegistry} registry - Command registry with command metadata
   * @param {Object} logger - Logger instance
   */
  constructor(config, registry, logger) {
    /** @type {Object} */
    this.config = config;
    /** @type {CommandRegistry} */
    this.registry = registry;
    /** @type {Object} */
    this.logger = logger;
  }

  /**
   * Register all commands from registry as Discord slash commands
   * Converts command registry into slash command definitions and registers globally
   * @returns {Promise<void>}
   * @throws {Error} If Discord API registration fails
   */
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
