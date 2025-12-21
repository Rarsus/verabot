const Command = require('../../core/commands/Command');
const EmbedFactory = require('./EmbedFactory');

/**
 * Adapter for handling Discord.js slash command interactions
 * Converts Discord interactions into Command objects and executes them through the bus
 * @class SlashCommandAdapter
 * @example
 * const adapter = new SlashCommandAdapter(client, bus, registry, logger, helpService);
 * adapter.registerListeners();
 */
class SlashCommandAdapter {
  /**
   * Create a new SlashCommandAdapter instance
   * @param {Client} client - Discord.js client instance
   * @param {CommandBus} bus - Command bus for execution
   * @param {CommandRegistry} registry - Command registry for metadata
   * @param {Object} logger - Logger instance
   * @param {HelpService} helpService - Help service for documentation
   */
  constructor(client, bus, registry, logger, helpService) {
    /** @type {Client} */
    this.client = client;
    /** @type {CommandBus} */
    this.bus = bus;
    /** @type {CommandRegistry} */
    this.registry = registry;
    /** @type {Object} */
    this.logger = logger;
    /** @type {HelpService} */
    this.helpService = helpService;
  }

  /**
   * Register Discord interaction listeners
   * Sets up handlers for chat input, autocomplete, and button interactions
   */
  registerListeners() {
    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        return this.handleChatInput(interaction);
      }

      if (interaction.isAutocomplete()) {
        return this.handleAutocomplete(interaction);
      }

      if (interaction.isButton()) {
        return this.handleButton(interaction);
      }
    });
  }

  /**
   * Handle slash command (chat input) interactions
   * @param {ChatInputCommandInteraction} interaction - Discord interaction object
   * @returns {Promise<void>}
   */
  async handleChatInput(interaction) {
    const group = interaction.commandName;
    const sub = interaction.options.getSubcommand();
    const meta = this.registry.getMeta(sub);
    if (!meta) return;

    const args = [];
    for (const opt of meta.options) {
      let val;
      switch (opt.type) {
        case 'integer':
          val = interaction.options.getInteger(opt.name);
          break;
        case 'boolean':
          val = interaction.options.getBoolean(opt.name);
          break;
        case 'user':
          val = interaction.options.getUser(opt.name)?.id || null;
          break;
        case 'role':
          val = interaction.options.getRole(opt.name)?.id || null;
          break;
        case 'channel':
          val = interaction.options.getChannel(opt.name)?.id || null;
          break;
        case 'string':
        default:
          val = interaction.options.getString(opt.name);
      }
      if (val !== null && val !== undefined) args.push(String(val));
    }

    const command = new Command({
      name: sub,
      source: 'discord',
      userId: interaction.user.id,
      channelId: interaction.channelId,
      args,
      metadata: {
        group,
        roles: interaction.member?.roles?.cache?.map((r) => r.id) || [],
      },
    });

    const startedAt = Date.now();
    try {
      const result = await this.bus.execute(command);
      const elapsedSec = (Date.now() - startedAt) / 1000;
      const cooldownSec = meta.cooldown?.seconds ?? null;

      let embed;
      let components = [];

      if (sub === 'help') {
        embed = this.renderHelp(result);
        if (result.data?.type === 'list') {
          components = [EmbedFactory.helpPaginationRow(result.data.category || null, result.data)];
        }
      } else if (sub === 'allowed') {
        embed = EmbedFactory.commandList(
          result.data.category,
          result.data.page,
          result.data.pages,
          result.data.items,
        );
        components = [EmbedFactory.helpPaginationRow(result.data.category || null, result.data)];
      } else if (sub === 'audit') {
        embed = EmbedFactory.audit(result.data.entries);
      } else {
        embed = EmbedFactory.commandResult(command, result, {
          cooldownSec,
          elapsedSec,
        });
      }

      return interaction.reply({ embeds: [embed], components });
    } catch (err) {
      this.logger.error({ err }, 'Slash command error');
      const embed = EmbedFactory.error(command, err);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  /**
   * Handle autocomplete interactions for slash command options
   * Provides suggestions for command and deployment target selection
   * @param {AutocompleteInteraction} interaction - Discord autocomplete interaction
   * @returns {Promise<void>}
   */
  async handleAutocomplete(interaction) {
    const sub = interaction.options.getSubcommand();
    const meta = this.registry.getMeta(sub);
    if (!meta) return;

    const focused = interaction.options.getFocused(true);
    const value = focused.value;

    if (sub === 'deploy' && focused.name === 'target') {
      const suggestions = ['staging', 'production', 'canary']
        .filter((t) => t.startsWith(value.toLowerCase()))
        .slice(0, 5)
        .map((t) => ({ name: t, value: t }));
      return interaction.respond(suggestions);
    }

    if (sub === 'help' && focused.name === 'command') {
      const suggestions = this.registry
        .listCommands()
        .filter((c) => c.name.startsWith(value.toLowerCase()))
        .slice(0, 10)
        .map((c) => ({ name: c.name, value: c.name }));
      return interaction.respond(suggestions);
    }

    return interaction.respond([]);
  }

  /**
   * Handle button click interactions for pagination
   * Updates the help embed with the requested page
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @returns {Promise<void>}
   */
  async handleButton(interaction) {
    const customId = interaction.customId;
    if (!customId.startsWith('help:')) return;

    const [, categoryKey, pageStr] = customId.split(':');
    const category = categoryKey === 'all' ? null : categoryKey;
    const page = Number(pageStr) || 1;

    const commands = this.helpService.getCommandsByCategory(category);
    const paginated = this.helpService.paginate(commands, page);

    const embed = EmbedFactory.commandList(
      category,
      paginated.page,
      paginated.pages,
      paginated.items,
    );
    const row = EmbedFactory.helpPaginationRow(category, paginated);

    return interaction.update({ embeds: [embed], components: [row] });
  }

  /**
   * Render help command result as Discord embed
   * Handles different help response types: command-specific, category list, or autocomplete suggestions
   * @param {CommandResult} result - Result from help command execution
   * @returns {MessageEmbed} Formatted embed ready for Discord reply
   * @private
   */
  renderHelp(result) {
    const data = result.data;
    if (data.type === 'command') {
      return EmbedFactory.commandHelp(data);
    }
    if (data.type === 'list') {
      return EmbedFactory.commandList(data.category, data.page, data.pages, data.items);
    }
    if (data.autocomplete) {
      return EmbedFactory.autocomplete(data.autocomplete);
    }
    return EmbedFactory.base().setDescription('No help available.');
  }
}

module.exports = SlashCommandAdapter;
