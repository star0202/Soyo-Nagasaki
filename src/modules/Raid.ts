import CustomEmbed from '../structures/Embed'
import CustomExt from '../structures/Extension'
import Confirm from '../structures/components/Confirm'
import { toTimestamp } from '../utils/time'
import { applicationCommand, listener, option } from '@pikokr/command.ts'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
} from 'discord.js'
import type { GuildMember, TextBasedChannel } from 'discord.js'

class Raid extends CustomExt {
  @listener({
    event: 'guildMemberAdd',
  })
  async shield(member: GuildMember) {
    const data = await this.db.server.findUnique({
      where: {
        id: member.guild.id,
      },
    })

    if (!data) return

    const now = Date.now()
    const diff = now - member.user.createdAt.getTime()

    if (diff > data.months * 30 * 24 * 60 * 60 * 1000) return

    await member.roles.add(data.role)

    const channel = member.guild.channels.cache.get(
      data.logChannel
    ) as TextBasedChannel

    if (!channel) return

    await channel.send({
      embeds: [
        new CustomEmbed()
          .setTitle('Raid Shield Activated')
          .setDetailedAuthor(member)
          .setUNIXTimestamp()
          .setColor(0xff0000)
          .addFields(
            {
              name: 'User',
              value: `<@${member.id}>`,
              inline: true,
            },
            {
              name: 'Configured Months',
              value: `${data.months} months`,
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
          ),
      ],
    })
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'setup',
    description: 'Set up the raid shield system.',
  })
  async setup(
    i: ChatInputCommandInteraction,
    @option({
      name: 'months',
      description: 'The number of months to set up the raid shield system.',
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      required: true,
    })
    months: number
  ) {
    await i.deferReply({
      ephemeral: true,
    })

    if (!i.guild)
      return i.editReply('This command can only be used on servers.')

    if (
      !(await i.guild.members.fetch(i.user.id))
        ?.permissionsIn(i.channelId)
        .has('Administrator')
    )
      return i.editReply('You do not have permission to use this command.')

    const role = await i.guild.roles.create({
      name: 'muted',
      color: '#546e7a',
      position: 1,
    })

    const channels = i.guild.channels.cache

    if (channels.size === 0) return i.editReply('No channels found.')

    Promise.all(
      channels.map((c) =>
        c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildCategory ||
        c.type === ChannelType.GuildVoice ||
        c.type === ChannelType.GuildStageVoice
          ? c.permissionOverwrites.create(role, {
              SendMessages: false,
              SendMessagesInThreads: false,
              CreatePrivateThreads: false,
              CreatePublicThreads: false,
              AddReactions: false,
              Connect: false,
            })
          : {}
      )
    )

    const res = await i.editReply({
      content: 'Please select the log channel.',
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('channel')
            .setPlaceholder('Select a channel')
        ),
      ],
    })

    res
      .createMessageComponentCollector({
        filter: (j) => j.user.id === i.user.id,
        componentType: ComponentType.ChannelSelect,
      })
      .on('collect', async (j) => {
        await j.deferUpdate()

        const channel = j.values[0]

        await i.editReply({
          content:
            'The raid shield system has been set up.\n' +
            `Role: <@&${role.id}>\n` +
            `Log channel: <#${channel}>`,
          components: [],
        })

        await this.db.server.upsert({
          where: {
            id: i.guildId!,
          },
          update: {
            months,
            role: role.id,
            logChannel: channel,
          },
          create: {
            id: i.guildId!,
            months,
            role: role.id,
            logChannel: channel,
          },
        })
      })
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'disable',
    description: 'Disable the raid shield system.',
  })
  async disable(i: ChatInputCommandInteraction) {
    await i.deferReply({
      ephemeral: true,
    })

    if (!i.guild)
      return i.editReply('This command can only be used on servers.')

    if (
      !i.guild.members.cache
        .get(i.user.id)
        ?.permissionsIn(i.channelId)
        .has('Administrator')
    )
      return i.editReply('You do not have permission to use this command.')

    const data = await this.db.server.findUnique({
      where: {
        id: i.guildId!,
      },
    })

    if (!data)
      return i.editReply('This server is not using the raid shield system.')

    const res = await i.editReply({
      content: 'Are you sure you want to disable the raid shield system?',
      components: [new Confirm()],
    })

    res
      .createMessageComponentCollector({
        filter: (j) => j.user.id === i.user.id,
        componentType: ComponentType.Button,
      })
      .on('collect', async (j) => {
        if (j.customId === 'confirm') {
          await j.deferUpdate()

          await i.guild!.roles.cache.get(data.role)!.delete()

          await i.editReply({
            content: 'The raid shield system has been disabled.',
            components: [],
          })

          await this.db.server.delete({
            where: {
              id: i.guildId!,
            },
          })
        } else {
          await j.deferUpdate()

          await i.editReply({
            content: 'The raid shield system has not been disabled.',
            components: [],
          })
        }
      })
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'info',
    description: 'Get the raid shield system settings.',
  })
  async info(i: ChatInputCommandInteraction) {
    await i.deferReply({
      ephemeral: true,
    })

    if (!i.guild)
      return i.editReply('This command can only be used on servers.')

    const data = await this.db.server.findUnique({
      where: {
        id: i.guildId!,
      },
    })

    if (!data)
      return i.editReply('This server is not using the raid shield system.')

    i.editReply({
      content: '설정 정보',
      embeds: [
        new CustomEmbed().setTitle('Raid Shield System').addFields(
          {
            name: 'Configured Months',
            value: `${data.months} months`,
            inline: true,
          },
          {
            name: 'Role',
            value: `<@&${data.role}>`,
            inline: true,
          },
          {
            name: 'Log Channel',
            value: `<#${data.logChannel}>`,
          }
        ),
      ],
    })
  }
}

export const setup = async () => new Raid()
