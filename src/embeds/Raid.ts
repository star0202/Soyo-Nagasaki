import CustomEmbed from '../structures/Embed'
import { toTimestamp } from '../utils/time'
import type { GuildMember } from 'discord.js'

export default class RaidEmbed {
  static activated = (member: GuildMember, months: number, now: number) =>
    new CustomEmbed()
      .setTitle('Raid Shield Activated')
      .setDetailedAuthor(member)
      .setUNIXTimestamp()
      .setColor('DarkRed')
      .addFields(
        {
          name: 'User',
          value: `<@${member.id}>`,
          inline: true,
        },
        {
          name: 'Configured Months',
          value: `${months} months`,
          inline: true,
        },
        {
          name: 'User Created At',
          value: `<t:${toTimestamp(member.user.createdAt)}:F>`,
        },
        {
          name: 'Server Time',
          value: `<t:${toTimestamp(now)}:F>`,
        }
      )

  static noChannels = () =>
    new CustomEmbed()
      .setTitle('No channels found')
      .setColor('Red')
      .setDescription('No channels were found in the server.')

  static notConfigured = () =>
    new CustomEmbed()
      .setTitle('Raid shield system not configured')
      .setColor('Red')
      .setDescription('This server is not using the raid shield system.')
}
