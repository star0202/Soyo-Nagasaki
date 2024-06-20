import CustomEmbed from '../structures/Embed'

export class Permission {
  private static get permissionFailed() {
    return new CustomEmbed().setTitle('권한 부족').setColor('Red')
  }

  static notOwner = () =>
    this.permissionFailed.setDescription(
      '봇 소유자만 사용할 수 있는 명령어입니다.'
    )

  static notAdmin = () =>
    this.permissionFailed.setDescription(
      '관리자만 사용할 수 있는 명령어입니다.'
    )
}
