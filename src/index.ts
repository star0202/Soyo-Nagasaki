import { config } from './config'
import Client from './structures/Client'
import { getLogger } from './utils/logging'
import { GatewayIntentBits } from 'discord.js'

const client = new Client({
  logger: getLogger('Client', config.debug ? 2 : 3),
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
})

;(async () => await client.start())()
