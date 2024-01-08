import CustomExt from '../structures/Extension'
import { toString } from '../utils/object'
import {
  applicationCommand,
  listener,
  option,
  ownerOnly,
} from '@pikokr/command.ts'
import { blue, green, yellow } from 'chalk'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  codeBlock,
} from 'discord.js'
import type {
  CommandInteractionOption,
  GuildBasedChannel,
  Interaction,
  Message,
} from 'discord.js'
import { basename, join } from 'path'

const commandLog = (data: CommandInteractionOption, indents = 0) =>
  `\n${' '.repeat(indents * 2)}- ${green(data.name)}: ${blue(
    data.value
  )} (${yellow(ApplicationCommandOptionType[data.type])})`

class Dev extends CustomExt {
  @listener({ event: 'applicationCommandInvokeError', emitter: 'cts' })
  async errorLogger(err: Error) {
    try {
      this.logger.error(err)
    } catch (e) {
      console.error(err)
      console.error(e)
    }
  }

  @listener({ event: 'interactionCreate' })
  async commandLogger(i: Interaction) {
    if (!i.isChatInputCommand()) return

    const options = i.options.data.map((data) =>
      data.type !== ApplicationCommandOptionType.Subcommand
        ? commandLog(data)
        : `\n- ${green(data.name)}: (${yellow('Subcommand')})` +
          data.options?.map((x) => commandLog(x, 1))
    )

    const guild = i.guild
      ? `${green(`#${(i.channel as GuildBasedChannel).name}`)}(${blue(
          i.channelId
        )}) at ${green(i.guild.name)}(${blue(i.guild.id)})`
      : 'DM'

    const msg = `${green(i.user.tag)}(${blue(
      i.user.id
    )}) in ${guild}: ${yellow.bold(`/${i.commandName}`)}${options}`

    this.logger.info(msg)
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'reload',
    description: '[OWNER] Reload all modules',
  })
  async reload(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.commandClient.registry.reloadModules().then((r) =>
      r.map((x) => ({
        path: basename(x.file),
        result: x.result,
        error: x.error?.message.normalize(),
      }))
    )

    let success = 0,
      fail = 0
    for (const x of data) {
      if (x.result) success++
      else fail++
    }

    await i.editReply(
      codeBlock(
        `✅ ${success} ❌ ${fail}\n` +
          data.map((x) => `${x.result ? '✅' : '❌'} ${x.path}`).join('\n')
      )
    )
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'load',
    description: '[OWNER] Load a module',
  })
  async load(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'module',
      description: 'Module name',
      required: true,
    })
    name: string
  ) {
    await i.deferReply()

    await this.commandClient.registry.loadModulesAtPath(
      join(__dirname, `${name}.ts`)
    )

    await i.editReply(codeBlock(`✅ ${name}.ts`))
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'unregister',
    description: '[OWNER] Unregister commands',
  })
  async unregister(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.Boolean,
      name: 'global',
      description: 'Global?',
      required: true,
    })
    global: boolean
  ) {
    await i.deferReply()

    if (global) this.client.application?.commands.set([])
    else i.guild?.commands.set([])

    await i.editReply('Done')
  }

  @ownerOnly
  @applicationCommand({
    type: ApplicationCommandType.ChatInput,
    name: 'sync',
    description: '[OWNER] Sync commands',
  })
  async sync(i: ChatInputCommandInteraction) {
    await i.deferReply()

    await this.commandClient.getApplicationCommandsExtension()?.sync()

    await i.editReply('Done')
  }

  @listener({ event: 'messageCreate' })
  async eval(msg: Message) {
    if (!this.commandClient.owners.has(msg.author.id)) return

    if (!msg.content.startsWith(`<@${this.client.user?.id}> eval`)) return

    const code = msg.content
      .split(' ')
      .slice(2)
      .join(' ')
      .replace(/```(js|ts)?/g, '')
      .trim()

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cts = this.commandClient

      const res = await eval(code)
      const lines = typeof res === 'string' ? res : toString(res)
      await msg.reply(codeBlock('ts', lines))
    } catch (e) {
      await msg.reply(`Error\n${codeBlock('js', `${e}`)}`)
    }
  }
}

export const setup = async () => new Dev()
