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
    const flagValues = new Map()
    const optValues = new Map()
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
            if (currentOpt._valueRequired) {
              throw new CliParsingError(
                `Value required for option '${currentOptName}'`
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
              flagValues.set(opt._variableName, true)
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
            optValues.set(currentOpt._variableName, values)
          }
          values.push(arg)
        } else {
          optValues.set(currentOpt._variableName, arg)
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

    if (currentOpt && currentOpt._valueRequired) {
      throw new CliParsingError(
        `Value required for option '${currentOptName}'`
      )
    }

    this._flags = command._flags.reduce((obj, flag) => {
      obj[flag._variableName] = flagValues.has(flag._variableName)
      return obj
    }, Object.create(null))

    this._options = command._options.reduce((obj, opt) => {
      const value = optValues.get(opt._variableName)
      const present = typeof value !== 'undefined'
      obj[opt._variableName] = {
        present,
        value: present ? value : opt._default
      }
      return obj
    }, Object.create(null))

    if (command._arguments) {
      this._args = command._arguments._arguments.reduce((obj, arg) => {
        if (arg instanceof Argument) {
          const value = argValues.get(arg._variableName)
          const present = typeof value !== 'undefined'
          obj[arg._variableName] = {
            present,
            value
          }
        }
        return obj
      }, Object.create(null))
    } else {
      this._args = {}
    }

    this._command = command
    Object.freeze(this._flags)
    Object.freeze(this._options)
    Object.freeze(this._args)
  }

  get flags () { return this._flags }

  get options () { return this._options }

  get args () { return this._args }
}

module.exports = Context
