const path = require('path')
const Command = require('./command')

/**
 * Represents a command line application
 * @augments Command
 * */
class Application extends Command {
  /**
   * Creates a new application with the given description.
   * @param {string} description The description of the application
   */
  constructor (description) {
    super(path.basename(process.argv[1], '.js'), description)
  }

  /**
   * Runs the application with the given arguments
   * @param {string[]} argv The array of arguments
   * @async
   */
  async run (argv) {
    argv = argv.slice()
    if (argv.length > 1 && argv[0] === process.execPath) {
      argv.splice(0, 1)
    }
    if (argv.length > 0 && argv[0] === process.mainModule.filename) {
      argv.splice(0, 1)
    }
    return super.run(argv)
  }
}

module.exports = Application
