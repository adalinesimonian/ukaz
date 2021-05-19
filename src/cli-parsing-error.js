/**
 * Represents an error that occurred while parsing command line arguments
 * @augments Error
 */
export default class CliParsingError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'CliParsingError'
  }
}
