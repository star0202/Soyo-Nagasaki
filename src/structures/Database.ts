import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { blue, yellow } from 'chalk'
import type { Logger } from 'tslog'

export default class Database extends PrismaClient {
  logger: Logger<unknown>

  constructor(logger: Logger<unknown>) {
    super({
      errorFormat: 'pretty',
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })

    this.logger = logger.getSubLogger({
      name: 'DB',
    })

    // @ts-expect-error Prisma typing issue?
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(
        `${e.query.replaceAll('?', blue.bold('?'))} [${e.params
          .slice(1, -1)
          .split(',')
          .map((param) => blue.bold(param))
          .join(', ')}] - ${yellow.bold(`${e.duration}ms`)}`
      )
    })
  }
}
