import { Emojis } from '../constants'
import CustomEmbed from '../structures/Embed'
import { basename } from 'node:path'

export class Eval {
  private static default = (code: string) =>
    new CustomEmbed().addChunkedFields({
      name: 'Input',
      value: code,
    })

  static success = (code: string, output: string) =>
    this.default(code)
      .setTitle('Successfully executed')
      .setColor('Green')
      .addChunkedFields({
        name: 'Output',
        value: output,
      })

  static error = (code: string, e: Error) =>
    this.default(code)
      .setTitle('Error occurred')
      .setColor('Red')
      .addChunkedFields({
        name: 'Stack trace',
        value: e.stack ?? 'N/A',
      })
}

export class Reload {
  static result = (
    modules: {
      file: string
      result: boolean
      error?: Error | undefined
      extensions?: object[] | undefined
    }[]
  ) => {
    const success = modules.filter((x) => x.result),
      fail = modules.filter((x) => !x.result)

    const { Success, Fail } = Emojis

    return new CustomEmbed()
      .setTitle('Every module reloaded')
      .setDescription(`${Success} ${success.length} ${Fail} ${fail.length}`)
      .addFields(
        {
          name: 'Success',
          value: success.map((x) => basename(x.file)).join('\n') || '*None*',
        },
        {
          name: 'Fail',
          value: fail.map((x) => basename(x.file)).join('\n') || '*None*',
        }
      )
  }
}

export class Sync {
  static success = () =>
    new CustomEmbed()
      .setTitle('Commands synced')
      .setDescription(`${Emojis.Success} Done`)
}
