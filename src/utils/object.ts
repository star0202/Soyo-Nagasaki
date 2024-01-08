import { inspect } from 'util'

export const toString = <T>(obj: T, ignore?: (keyof T)[]): string => {
  const copied = structuredClone(obj)

  if (ignore) ignore.forEach((key) => delete copied[key])

  return inspect(copied, {
    maxArrayLength: 200,
    depth: 2,
  })
}
