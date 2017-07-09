const Flag = require('./flag')
const Option = require('./option')
const Argument = require('./argument')
const CliParsingError = require('./cli-parsing-error')

/** Represents the context of a running command. */
class Context {
  /**
   * Creates a new context object.
   * @param {Command} command The currently executing command.
   * @param {string[]} argv The arguments passed to the command.
   */
  constructor (command, argv) {
    const optMap = new Map()
    const argValues = new Map()
    command._options.concat(command._flags).forEach(opt => {
      opt._shortNames.forEach(name => optMap.set(name, opt))
      opt._longNames.forEach(name => optMap.set(name, opt))
    })
    let argumentsOnly = false
    let currentOpt = null
    let currentOptName = null
    const expectedArgs = command._arguments
      ? command._arguments._arguments.slice()
      : []
    let currentVariadicArg = null
    argv.forEach(arg => {
      if (!argumentsOnly) {
        if (arg === '--') {
          argumentsOnly = true
          return
        }
        if (arg.length > 1 && arg.startsWith('-')) {
          if (currentOpt) {
            if (currentOpt._required) {
              throw new CliParsingError(
                `Value required for option ${currentOptName}`
              )
            } else {
              currentOpt = null
              currentOptName = null
            }
          }
          const optNames = arg.startsWith('--')
            ? [arg.substr(2)]
            : arg.substr(1).split('')
          optNames.forEach(optName => {
            const opt = optMap.get(optName)
            if (opt instanceof Flag) {
              argValues.set(opt._variableName, true)
            } else if (opt instanceof Option) {
              if (currentOpt) {
                throw new CliParsingError(
                  'Cannot use shorthand for multiple options that require ' +
                  `values: '${optName}', '${currentOptName}'`
                )
              }
              currentOpt = opt
              currentOptName = arg
            } else {
              throw new CliParsingError(`Unrecognised option '${arg}'`)
            }
          })
          return
        }
      }
      if (currentOpt) {
        if (currentOpt._multi) {
          let values = argValues.get(currentOpt._variableName)
          if (!values) {
            values = []
            argValues.set(currentOpt._variableName, values)
          }
          values.push(arg)
        } else {
          argValues.set(currentOpt._variableName, arg)
        }
        currentOpt = null
        currentOptName = null
        return
      }
      if (currentVariadicArg) {
        argValues
          .get(currentVariadicArg._variableName)
          .push(arg)
        return
      }

      const currentArgSet = []
      while (
        expectedArgs.length > 0 &&
        !(currentArgSet[currentArgSet.length - 1] instanceof Argument) &&
        currentArgSet[currentArgSet.length - 1] !== ' '
      ) {
        currentArgSet.push(...expectedArgs.splice(0, 2))
      }
      if (!(currentArgSet[currentArgSet.length - 1] instanceof Argument)) {
        currentArgSet.splice(currentArgSet.length - 1)
      }
      const remainingArgSet = currentArgSet.slice()
      let argFragment = arg.slice()
      while (typeof remainingArgSet[1] === 'string') {
        const delimStart = argFragment.indexOf(currentArgSet[1])
        if (delimStart === -1) {
          throw new CliParsingError(
            'Arguments in invalid format. Expected ' +
            currentArgSet.reduce((args, arg) => args + arg) +
            `, received ${arg}`
          )
        }
        argValues.set(
          remainingArgSet[0]._variableName,
          argFragment.substring(0, delimStart)
        )
        argFragment = argFragment.slice(delimStart + remainingArgSet[1].length)
        remainingArgSet.splice(0, 2)
      }
      if (remainingArgSet.length === 0 && argFragment) {
        throw new CliParsingError(`Superfluous argument '${argFragment}'`)
      }
      if (remainingArgSet[0]._variadic) {
        currentVariadicArg = remainingArgSet[0]
        argValues.set(remainingArgSet[0]._variableName, [argFragment])
      } else {
        argValues.set(remainingArgSet[0]._variableName, argFragment)
      }
    })

    if (currentOpt) {
      throw new CliParsingError(
        `Missing value for option '${currentOptName}'`
      )
    }

    this._command = command
    this._args = Object.create(null)
    Array.from(argValues).forEach(([varName, value]) => {
      this._args[varName] = value
    })
    Object.freeze(this._args)
  }

  get args () { return this._args }
}

module.exports = Context
