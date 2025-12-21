const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

class EmbedFactory {
  static base() {
    return new EmbedBuilder().setColor(0x2b6cb0).setTimestamp();
  }

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

  static error(command, err) {
    return this.base()
      .setTitle(`❌ ${command.name}`)
      .setDescription(`Error: ${err.message}`)
      .setColor(0xc53030);
  }

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

  static autocomplete(suggestions) {
    return this.base()
      .setTitle('🔍 Suggestions')
      .setDescription(
        suggestions.length
          ? suggestions.map(s => `• \`${s}\``).join('\n')
          : 'No suggestions found.'
      );
  }

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
