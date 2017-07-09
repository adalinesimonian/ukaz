/**
 * Represents an error that occurred while parsing command line arguments
 * @augments Error
 */
class CliParsingError extends Error {
  constructor () {
    super()
    this.name = 'CliParsingError'
  }
 }

module.exports = CliParsingError
