import CustomEmbed from '../structures/Embed'

export class Permission {
  private static get permissionDenied() {
    return new CustomEmbed().setTitle('Permission denied').setColor('Red')
  }

  static notOwner = () =>
    this.permissionDenied.setDescription(
      'You must be the owner of the bot to use this command'
    )

  static notAdministrator = () =>
    this.permissionDenied.setDescription(
      'You must be an administrator of the server to use this command'
    )
}

export class IncorrectUsage {
  private static get incorrectUsage() {
    return new CustomEmbed().setTitle('Incorrect usage').setColor('Red')
  }

  static notInServer = () =>
    this.incorrectUsage.setDescription(
      'This command can only be used in a server'
    )
}
