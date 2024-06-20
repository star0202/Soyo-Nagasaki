import { inspect } from 'node:util'

export const toString = <T>(obj: T, ignore?: (keyof T)[]): string => {
  let cur = obj
  if (ignore) {
    try {
      cur = structuredClone(obj)
    } catch (e) {
      console.error(e)
    }

    ignore.forEach((key) => delete cur[key])
  }

  return inspect(cur, {
    maxArrayLength: 200,
    depth: 2,
  })
}
