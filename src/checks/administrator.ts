import { createCommandCheckDecorator } from '.'
import { IncorrectUsage, Permission } from '../embeds/Error'
import KnownError from '../structures/Error'
import type { ChatInputCommandInteraction, User } from 'discord.js'

class AdministratorOnlyError extends KnownError {
  constructor(user: User) {
    super(`${user.tag}(${user.id}) - Invoked administrator only command`)
  }
}

class ServerOnlyError extends KnownError {
  constructor(user: User) {
    super(`${user.tag}(${user.id}) - Invoked server only command`)
  }
}

export const administratorOnly = createCommandCheckDecorator(
  async (_, i: ChatInputCommandInteraction) => {
    const isInServer = !!i.guild
    const isAdministrator =
      i.guild &&
      (await i.guild.members.fetch(i.user.id)).permissions.has('Administrator')

    if (!isInServer) {
      await i.reply({
        embeds: [IncorrectUsage.notInServer()],
        ephemeral: true,
      })

      throw new ServerOnlyError(i.user)
    }

    if (!isAdministrator) {
      await i.reply({
        embeds: [Permission.notAdministrator()],
        ephemeral: true,
      })

      throw new AdministratorOnlyError(i.user)
    }
  }
)
