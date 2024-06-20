import { Colors } from '../constants'
import { toTimestamp } from '../utils/time'
import {
  EmbedBuilder,
  GuildMember,
  codeBlock,
  normalizeArray,
} from 'discord.js'
import type {
  APIEmbed,
  APIEmbedField,
  EmbedData,
  RestOrArray,
  User,
} from 'discord.js'

const chunk = (content: string, limit = 1024 - 10) => {
  const chunked = []
  let cur = 0
  let end = limit

  while (cur < content.length) {
    end = cur + limit

    if (end >= content.length) {
      chunked.push(content.slice(cur))

      break
    }

    const lastNewline = content.lastIndexOf('\n', end)
    if (lastNewline !== -1 && lastNewline > cur) end = lastNewline

    chunked.push(content.slice(cur, end))

    cur = end + 1
  }

  return chunked
}

export default class CustomEmbed extends EmbedBuilder {
  constructor(data?: EmbedData | APIEmbed) {
    super({ color: Colors.Default, ...data })
  }

  setUNIXTimestamp(timestamp = Date.now()) {
    return this.setFooter({
      text: toTimestamp(timestamp),
    }).setTimestamp(timestamp)
  }

  setDetailedAuthor(userOrMember: User | GuildMember) {
    const user =
      userOrMember instanceof GuildMember ? userOrMember.user : userOrMember

    return this.setAuthor({
      name: `${user.tag} (${user.id})`,
      iconURL: user.displayAvatarURL(),
    })
  }

  addChunkedFields(
    ...fields: RestOrArray<
      APIEmbedField & {
        nameF?: (title: string, idx: number, total: number) => string
        valueF?: (value: string) => string
      }
    >
  ) {
    normalizeArray(fields).forEach((field) => {
      const { name, value, inline, nameF, valueF } = field
      let chunked = chunk(value)
      const originalLength = chunked.length
      const _nameF =
        nameF ??
        (chunked.length > 1
          ? (name, idx, total) => `${name} ${idx + 1}/${total}`
          : (name) => name)
      const _valueF = valueF ?? ((x) => codeBlock('ts', x))

      // TODO: calculate actual size of embed (or use embed paginator)
      if (chunked.length > 5) {
        chunked[4] += `\n... and ${chunked
          .slice(5)
          .reduce((acc, cur) => acc + cur.split('\n').length, 0)} more lines`

        chunked = chunked.slice(0, 5)
      }

      this.addFields(
        chunked.map((v, idx) => ({
          name: _nameF(name, idx, originalLength),
          value: _valueF(v),
          inline,
        }))
      )
    })

    return this
  }
}
