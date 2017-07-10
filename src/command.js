const ArgumentSet = require('./argument-set')
const Flag = require('./flag')
const Option = require('./option')
const Context = require('./context')
const CliParsingError = require('./cli-parsing-error')

/**
 * A function which initialises properties on a given command.
 *
 * @typedef {function(Command)} commandInitialiser
 */

/**
 * An async function which handles execution of a command.
 *
 * @typedef {function(Context)} commandHandler
 * @async
 */

/** Represents a single command in the application */
class Command {
  constructor (name, description) {
    /**
     * @type {string}
     * @private
     */
    this._name = name
    /**
     * @type {string}
     * @private
     */
    this._description = description
    /**
     * @type {Flag[]}
     * @private
     */
    this._flags = []
    /**
     * @type {Option[]}
     * @private
     */
    this._options = []
    /**
     * @type {string[]}
     * @private
     */
    this._aliases = []
    /**
     * @type {Command}
     * @private
     */
    this._parent = null
    /**
     * @type {Command[]}
     * @private
     */
    this._commands = []
    /**
     * @type {ArgumentSet}
     * @private
     */
    this._arguments = null
    /**
     * @type {commandHandler[]}
     * @private
     * @async
     */
    this._handlers = []
  }

  /**
   * Sets the name of the command.
   * @param {string} name The command's name
   * @returns {Command}
   */
  name (name) {
    this._name = name
    return this
  }

  /**
   * Sets the description of the command.
   * @param {string} description The command's description
   * @returns {Command}
   */
  description (description) {
    this._description = description
    return this
  }

  /**
   * Adds a subcommand to the current command.
   * @param {string} name The subcommand's name
   * @param {string} description The subcommand's description
   * @param {commandInitialiser} initialiser A function which will initialise
   * properties on the subcommand.
   * @returns {Command}
   */
  command (name, description, initialiser) {
    const command = new Command(name, description)
    command._parent = this
    this._commands.push(command)
    if (initialiser) {
      initialiser(command)
    }
    return this
  }

  /**
   * Adds an alias for the command.
   * @param {string} alias The alias to add
   * @returns {Command}
   */
  alias (alias) {
    this._aliases.push(alias)
    return this
  }

  /**
   * Sets the arguments the command should accept.
   * @param {string} args The arguments to accept, e.g.
   * `<arg1> <arg2>..<arg3> [arg4 ...]`
   * @returns {Command}
   */
  arguments (args) {
    this._arguments = new ArgumentSet(args)
    return this
  }

  /**
   * Adds a flag that the command should accept.
   * @param {string} flag The flag definition, e.g. `-f, --force`
   * @param {string} description The flag's description
   * @param {object} options
   * @param {string} options.variableName The name to use for the variable that
   * will contain the flag's value.
   * @returns {Command}
   */
  flag (flag, description, { variableName } = {}) {
    this._flags.push(new Flag(flag, description, { variableName }))
    return this
  }

  /**
   * Adds an option that the command should accept.
   * @param {string} option The option definition, e.g. `-o, --output <dir>`
   * @param {string} description The option's description
   * @param {object} options
   * @param {string} options.default Default value for the option, if omitted.
   * @param {string} options.multi Whether or not the option accepts multiple
   * values.
   * @param {string} options.variableName The name to use for the variable that
   * will contain the option's value.
   * @returns {Command}
   */
  option (option, description, {
    default: defaultValue,
    multi = false,
    variableName
  } = {}) {
    this._options.push(new Option(option, description, {
      default: defaultValue,
      multi,
      variableName
    }))
    return this
  }

  /**
   * Sets the handler for the command.
   * @param {commandHandler} handler An async function that runs whenever the
   * command is executed with the correct arguments.
   * @returns {Command}
   */
  handler (handler) {
    this._handlers.push(handler)
    return this
  }

  /**
   * Adds a help flag that shows usage information for the command.
   * @param {string} definition Optional. Sets a different definition for the
   * help flag instead of the default `-h,--help`.
   * */
  helpFlag (definition = '-h,--help') {
    const help = Symbol('help')
    return this.flag(definition, 'Shows usage information.', {
      variableName: help
    })
      .handler(ctx => {
        if (ctx.flags[help]) {
          this.usage()
          return false
        }
        return true
      })
  }

  /** Adds a validation handler that validates the arguments */
  validate () {
    return this.handler(ctx => {
      ctx._command._arguments &&
        ctx._command._arguments._arguments.forEach(arg => {
          if (arg._required && typeof ctx.args[arg._variableName] === 'undefined') {
            throw new CliParsingError(
              `Missing required argument '${arg._name}'`
            )
          }
        })

      return true
    })
  }

  /** Prints the usage information for the command to screen. */
  usage () {
    let name = this._name
    let parent = this._parent
    while (parent) {
      name = `${parent._name} ${name}`
      parent = parent._parent
    }
    const flagsAndOptions = this._flags.concat(this._options)
    if (flagsAndOptions.length > 0 || this._arguments) {
      console.log(
        'Usage: ' +
        name +
        (flagsAndOptions.length > 0
          ? ' [options]'
          : '') +
        (this._arguments
          ? ` ${this._arguments}`
          : '')
      )
      if (this._commands.length > 0) {
        console.log('or')
      }
    }
    if (this._commands.length > 0) {
      console.log(`Usage: ${name} [command]`)
    }
    if (this._aliases.length > 0) {
      console.log(`Aliases: ${this._aliases.join(', ')}`)
    }
    this._description && console.log(this._description)
    const nameWidth = flagsAndOptions
      .map(opt => opt.toString())
      .concat(this._commands.map(cmd =>
        [cmd._name].concat(cmd._aliases).join(', ')
      ))
      .reduce((max, opt) => Math.max(max, opt.toString().length), 0)
    if (flagsAndOptions.length > 0) {
      console.log()
      console.log('Options:')
      flagsAndOptions.forEach(opt => {
        console.log(
          '  ' +
          opt.toString().padEnd(nameWidth) +
          (opt._description
            ? `  ${opt._description}`
            : '')
        )
      })
    }
    if (this._commands.length > 0) {
      console.log()
      console.log('Commands:')
      this._commands.forEach(cmd => {
        console.log(
          '  ' +
          [cmd._name].concat(cmd._aliases).join(', ').padEnd(nameWidth) +
          (cmd._description
            ? `  ${cmd._description}`
            : '')
        )
      })
    }
  }

  /**
   * Executes the command's handlers with the given context.
   * @param {Context} context
   * @private
   */
  async _execute (context) {
    for (let i = 0; i < this._handlers.length; i++) {
      const handler = this._handlers[i]
      if (!await handler(context)) { // eslint-disable-line no-await-in-loop
        break
      }
    }
  }

  /**
   * Runs the command with the given arguments
   * @param {string[]} argv The array of arguments
   * @async
   */
  async run (argv) {
    argv = argv.slice()
    if (argv.length === 0) {
      return this._handlers.length > 0
        ? this._execute(new Context(this, argv))
        : this.usage()
    }
    const matchingCommand = this._commands.find(c =>
      c._name === argv[0] || c._aliases.some(a => a === argv[0])
    )
    if (matchingCommand) {
      return matchingCommand.run(argv.slice(1))
    }
    return this._handlers.length > 0
          ? this._execute(new Context(this, argv))
          : this.usage()
  }
}

module.exports = Command
