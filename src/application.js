import path from 'node:path'
import Command from './command.js'

/**
 * Represents a command line application
 * @augments Command
 * */
// eslint-disable-next-line unicorn/prevent-abbreviations
export default class Application extends Command {
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
    argv = [...argv]
    if (argv.length > 1 && argv[0] === process.execPath) {
      argv.splice(0, 2)
    }

    return super.run(argv)
  }
}
