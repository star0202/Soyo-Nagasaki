import { config } from '../config'
import { VERSION } from '../constants'
import Database from './Database'
import { CommandClient } from '@pikokr/command.ts'
import { green } from 'chalk'
import { ActivityType, Client } from 'discord.js'
import type { GatewayIntentBits } from 'discord.js'
import { short } from 'git-rev-sync'
import { Jejudo } from 'jejudo'
import { join } from 'path'
import { Logger } from 'tslog'

export default class CustomClient extends CommandClient {
  private jejudo!: Jejudo

  readonly db: Database

  constructor(config: {
    logger: Logger<unknown>
    intents: GatewayIntentBits[]
  }) {
    const { logger, intents } = config

    super(
      new Client({
        intents,
      }),
      logger
    )

    this.discord.once('ready', (client) => this.onReady(client))

    this.discord.on('debug', (msg) => {
      this.logger.debug(msg)
    })

    this.db = new Database(this.logger)
  }

  async setup() {
    await this.enableApplicationCommandsExtension({ guilds: config.guilds })

    await this.registry.loadAllModulesInDirectory(
      join(__dirname, '..', 'modules')
    )
  }

  async onReady(client: Client<true>) {
    this.jejudo = new Jejudo(client, {
      isOwner: (user) => this.owners.has(user.id),
      prefix: `<@${client.user.id}> `,
      noPermission: (i) => i.reply('Permission denied'),
    })

    client.on('messageCreate', (msg) => this.jejudo.handleMessage(msg))

    client.on('interactionCreate', (i) => {
      this.jejudo.handleInteraction(i)
    })

    client.user.setPresence({
      activities: [
        {
          name: `${VERSION} (${short() ?? 'N/A'})`,
          type: ActivityType.Playing,
        },
      ],
    })

    this.logger.info(`Logged in as: ${green(client.user.tag)}`)

    await this.fetchOwners()
  }

  async start() {
    await this.setup()

    await this.discord.login(config.token)

    await this.getApplicationCommandsExtension()?.sync()
  }
}
