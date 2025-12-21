const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

/**
 * Factory for creating standardized Discord embeds for various command outputs
 * @class EmbedFactory
 * @example
 * const embed = EmbedFactory.commandResult(command, result);
 * await interaction.reply({ embeds: [embed] });
 */
class EmbedFactory {
  /**
   * Create a base embed with standard styling
   * @static
   * @returns {EmbedBuilder} Base embed with color and timestamp
   */
  static base() {
    return new EmbedBuilder().setColor(0x2b6cb0).setTimestamp();
  }

  /**
   * Create embed for command execution result
   * @static
   * @param {Command} command - The executed command
   * @param {CommandResult} result - Command execution result
   * @param {Object} [options] - Display options
   * @param {number} [options.elapsedSec] - Execution time in seconds
   * @param {number} [options.cooldownSec] - Cooldown time in seconds
   * @returns {EmbedBuilder} Result embed
   */
  static commandResult(command, result, { cooldownSec, elapsedSec } = {}) {
    const embed = this.base()
      .setTitle(`✅ ${command.name}`)
      .setDescription(
        result.success
          ? (result.data?.message || 'Success.')
          : (result.error?.message || 'Failed.')
      );

    if (elapsedSec !== undefined || cooldownSec !== undefined) {
      const footerParts = [];
      if (elapsedSec !== undefined) footerParts.push(`took ${elapsedSec.toFixed(2)}s`);
      if (cooldownSec !== undefined) footerParts.push(`cooldown ${cooldownSec}s`);
      if (footerParts.length) embed.setFooter({ text: footerParts.join(' • ') });
    }

    return embed;
  }

  /**
   * Create embed for command error
   * @static
   * @param {Command} command - The command that errored
   * @param {Error} err - The error that occurred
   * @returns {EmbedBuilder} Error embed with red color
   */
  static error(command, err) {
    return this.base()
      .setTitle(`❌ ${command.name}`)
      .setDescription(`Error: ${err.message}`)
      .setColor(0xc53030);
  }

  /**
   * Create embed with help for a single command
   * @static
   * @param {Object} meta - Command metadata
   * @param {string} meta.name - Command name
   * @param {string} meta.description - Command description
   * @param {string} meta.category - Command category
   * @param {string} meta.usage - Command usage
   * @param {string[]} meta.examples - Usage examples
   * @returns {EmbedBuilder} Command help embed
   */
  static commandHelp(meta) {
    return this.base()
      .setTitle(`📘 Command: ${meta.name}`)
      .setDescription(meta.description)
      .addFields(
        { name: 'Category', value: meta.category, inline: true },
        { name: 'Usage', value: `\`${meta.usage}\``, inline: true }
      )
      .addFields({
        name: 'Examples',
        value: meta.examples.map(e => `• \`${e}\``).join('\n') || 'None'
      });
  }

  /**
   * Create embed with paginated command list
   * @static
   * @param {string|null} category - Command category or null for all
   * @param {number} page - Current page number
   * @param {number} pages - Total number of pages
   * @param {Array<Object>} items - Command items to display
   * @returns {EmbedBuilder} Command list embed
   */
  static commandList(category, page, pages, items) {
    const title = category ? `📂 Commands in category: ${category}` : '📚 All Commands';

    const embed = this.base()
      .setTitle(title)
      .setFooter({ text: `Page ${page} of ${pages}` });

    if (items.length === 0) {
      embed.setDescription('No commands found.');
      return embed;
    }

    return embed.addFields(
      items.map(c => ({
        name: c.name,
        value: c.description,
        inline: false
      }))
    );
  }

  /**
   * Create embed with autocomplete suggestions
   * @static
   * @param {string[]} suggestions - Suggested command names
   * @returns {EmbedBuilder} Suggestions embed
   */
  static autocomplete(suggestions) {
    return this.base()
      .setTitle('🔍 Suggestions')
      .setDescription(
        suggestions.length
          ? suggestions.map(s => `• \`${s}\``).join('\n')
          : 'No suggestions found.'
      );
  }

  /**
   * Create pagination buttons for help command
   * @static
   * @param {string|null} category - Command category for navigation
   * @param {Object} pagination - Pagination info
   * @param {number} pagination.page - Current page
   * @param {number} pagination.pages - Total pages
   * @returns {ActionRowBuilder} Button row for pagination
   */
  static helpPaginationRow(category, { page, pages }) {
    const catKey = category || 'all';
    const prevDisabled = page <= 1;
    const nextDisabled = page >= pages || pages === 0;

    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`help:${catKey}:${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(prevDisabled),
      new ButtonBuilder()
        .setCustomId(`help:${catKey}:${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(nextDisabled)
    );
  }

  /**
   * Create embed with audit log entries
   * @static
   * @param {Array<Object>} entries - Audit log entries
   * @param {string} entries[].timestamp - Entry timestamp
   * @param {string} entries[].command - Command executed
   * @param {string} entries[].user - User who executed command
   * @param {boolean} entries[].success - Whether command succeeded
   * @returns {EmbedBuilder} Audit log embed
   */
  static audit(entries) {
    return this.base()
      .setTitle('📝 Audit Log')
      .setDescription(
        entries.length
          ? entries
            .map(
              e =>
                `• [${e.timestamp}] ${e.command} by ${e.user} (${e.success ? '✅' : '❌'})`
            )
            .join('\n')
          : 'No audit entries.'
      );
  }
}

module.exports = EmbedFactory;

