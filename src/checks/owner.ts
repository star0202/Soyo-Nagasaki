import { createCommandCheckDecorator } from '.'
import { Permission } from '../embeds/Error'
import KnownError from '../structures/Error'
import type { CommandClient } from '@pikokr/command.ts'
import type { ChatInputCommandInteraction, User } from 'discord.js'

class OwnerOnlyError extends KnownError {
  constructor(user: User) {
    super(`${user.tag}(${user.id}) - Invoked owner only command`)
  }
}

export const ownerOnly = createCommandCheckDecorator(
  async (client: CommandClient, i: ChatInputCommandInteraction) => {
    const isOwner = await client.isOwner(i.user)

    if (!isOwner) {
      await i.reply({
        embeds: [Permission.notOwner()],
        ephemeral: true,
      })

      throw new OwnerOnlyError(i.user)
    }
  }
)
