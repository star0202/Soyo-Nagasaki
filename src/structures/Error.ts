export default class KnownError extends Error {
  constructor(message: string) {
    super()

    this.name = this.constructor.name
    this.message = this.constructor.name + ': ' + message
  }
}
