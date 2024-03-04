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
          .setTitle('의심스러운 계정 감지')
          .setDetailedAuthor(member)
          .setUNIXTimestamp()
          .setColor(0xff0000)
          .addFields(
            {
              name: '유저',
              value: `<@${member.id}>`,
              inline: true,
            },
            {
              name: '설정된 가입 개월 수',
              value: `${data.months}개월`,
              inline: true,
            },
            {
              name: '가입일',
              value: `<t:${toTimestamp(member.user.createdAt)}:F>`,
            },
            {
              name: '서버 타임',
              value: `<t:${toTimestamp(now)}:F>`,
            }
          ),
      ],
    })
  }

  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: '설정',
    description: '레이드 방어 시스템을 설정합니다.',
  })
  async setup(
    i: ChatInputCommandInteraction,
    @option({
      name: 'months',
      description: '의심스러운 계정으로 판단할 가입 개월 수입니다.',
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
      return i.editReply('이 명령어는 서버에서만 사용할 수 있습니다.')

    if (
      !(await i.guild.members.fetch(i.user.id))
        ?.permissionsIn(i.channelId)
        .has('Administrator')
    )
      return i.editReply('이 명령어를 사용할 권한이 없습니다.')

    const role = await i.guild.roles.create({
      name: 'muted',
      color: '#546e7a',
      position: 1,
    })

    const channels = i.guild.channels.cache

    if (channels.size === 0) return i.editReply('이 서버에는 채널이 없습니다.')

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
      content: '로그 채널을 선택해주세요.',
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('channel')
            .setPlaceholder('채널 선택')
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
            '설정이 완료되었습니다.\n' +
            `역할: <@&${role.id}>\n` +
            `로그 채널: <#${channel}>`,
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
    name: '해제',
    description: '레이드 방어 시스템을 해제합니다.',
  })
  async disable(i: ChatInputCommandInteraction) {
    await i.deferReply({
      ephemeral: true,
    })

    if (!i.guild)
      return i.editReply('이 명령어는 서버에서만 사용할 수 있습니다.')

    if (
      !i.guild.members.cache
        .get(i.user.id)
        ?.permissionsIn(i.channelId)
        .has('Administrator')
    )
      return i.editReply('이 명령어를 사용할 권한이 없습니다.')

    const data = await this.db.server.findUnique({
      where: {
        id: i.guildId!,
      },
    })

    if (!data)
      return i.editReply(
        '이 서버는 레이드 방어 시스템을 사용하지 않고 있습니다.'
      )

    const res = await i.editReply({
      content: '설정을 해제하시겠습니까?',
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
            content: '설정이 해제되었습니다.',
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
            content: '설정 해제가 취소되었습니다.',
            components: [],
          })
        }
      })
  }
}

export const setup = async () => new Raid()
