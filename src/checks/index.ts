import { createComponentHook } from '@pikokr/command.ts'
import type { CommandClient, ComponentHookFn } from '@pikokr/command.ts'
import type { ChatInputCommandInteraction } from 'discord.js'

export const createCommandCheckDecorator = (
  fn: ComponentHookFn<[CommandClient, ChatInputCommandInteraction]>
) => createComponentHook('beforeCall', fn)
