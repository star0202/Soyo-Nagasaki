import { Emojis } from '../constants'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import type {
  ButtonInteraction,
  CommandInteraction,
  InteractionEditReplyOptions,
  MessageComponentInteraction,
} from 'discord.js'

type EditReplyInteraction = CommandInteraction | MessageComponentInteraction

type CallbackFn<Interaction extends EditReplyInteraction> = (args: {
  i: Interaction
  c: ButtonInteraction
}) => Promise<unknown>

type ButtonOptions = {
  label?: string
  emoji?: string
  style?: ButtonStyle
}

export default class Confirm<Interaction extends EditReplyInteraction> {
  constructor(
    private readonly i: Interaction,
    private readonly config: {
      message: string | InteractionEditReplyOptions
      confirm: string | ButtonOptions
      deny: string | ButtonOptions
      defer?: boolean
      confirmFn: CallbackFn<Interaction>
      denyFn: CallbackFn<Interaction>
    }
  ) {}

  async send() {
    const { message, confirm, deny, defer, confirmFn, denyFn } = this.config

    const _confirm =
      typeof confirm === 'string'
        ? { label: confirm, emoji: Emojis.Confirm, style: ButtonStyle.Success }
        : {
            label: confirm.label ?? 'Confirm',
            emoji: confirm.emoji ?? Emojis.Confirm,
            style: confirm.style ?? ButtonStyle.Success,
          }
    const _deny =
      typeof deny === 'string'
        ? { label: deny, emoji: Emojis.Deny, style: ButtonStyle.Danger }
        : {
            label: deny.label ?? 'Deny',
            emoji: deny.emoji ?? Emojis.Deny,
            style: deny.style ?? ButtonStyle.Danger,
          }

    const _message = typeof message === 'string' ? { content: message } : message

    const msg = await this.i.editReply({
      ..._message,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel(_confirm.label)
            .setStyle(_confirm.style)
            .setEmoji(_confirm.emoji),
          new ButtonBuilder()
            .setCustomId('deny')
            .setLabel(_deny.label)
            .setStyle(_deny.style)
            .setEmoji(_deny.emoji)
        ),
      ],
    })

    msg
      .createMessageComponentCollector({
        filter: (c) => c.user.id === this.i.user.id,
        componentType: ComponentType.Button,
      })
      .on('collect', async (c) => {
        if (defer) await c.deferUpdate()

        if (c.customId === 'confirm') confirmFn({ i: this.i, c })
        else denyFn({ i: this.i, c })
      })
  }
}
