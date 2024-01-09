import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export default class Confirm extends ActionRowBuilder<ButtonBuilder> {
  constructor() {
    super()

    this.addComponents(
      new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('확인')
        .setEmoji('⭕')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('취소')
        .setEmoji('✖️')
        .setStyle(ButtonStyle.Danger)
    )
  }
}
