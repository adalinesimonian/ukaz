import Flag from './flag.js'
import Option from './option.js'
import Argument from './argument.js'
import CliParsingError from './cli-parsing-error.js'

/** Represents the context of a running command. */
export default class Context {
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
    for (const opt of [...command._options, ...command._flags]) {
      for (const name of opt._shortNames) optMap.set(name, opt)
      for (const name of opt._longNames) optMap.set(name, opt)
    }

    let argumentsOnly = false
    let currentOpt = null
    let currentOptName = null
    const expectedArgs = command._arguments
      ? [...command._arguments._arguments]
      : []
    let currentVariadicArg = null
    for (const arg of argv) {
      if (!argumentsOnly) {
        if (arg === '--') {
          argumentsOnly = true
          continue
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
            ? [arg.slice(2)]
            : arg.slice(1).split('')
          for (const optName of optNames) {
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
          }

          continue
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
        continue
      }

      if (currentVariadicArg) {
        argValues
          .get(currentVariadicArg._variableName)
          .push(arg)
        continue
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
        currentArgSet.splice(-1)
      }

      const remainingArgSet = [...currentArgSet]
      let argFragment = [...arg]
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
          argFragment.slice(0, Math.max(0, delimStart))
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
    }

    if (currentOpt && currentOpt._valueRequired) {
      throw new CliParsingError(
        `Value required for option '${currentOptName}'`
      )
    }

    this._flags = command._flags.reduce((object, flag) => {
      object[flag._variableName] = flagValues.has(flag._variableName)
      return object
    }, Object.create(null))

    this._options = command._options.reduce((object, opt) => {
      const value = optValues.get(opt._variableName)
      const present = typeof value !== 'undefined'
      object[opt._variableName] = {
        present,
        value: present ? value : opt._default
      }
      return object
    }, Object.create(null))

    if (command._arguments) {
      this._args = command._arguments._arguments.reduce((object, arg) => {
        if (arg instanceof Argument) {
          const value = argValues.get(arg._variableName)
          const present = typeof value !== 'undefined'
          object[arg._variableName] = {
            present,
            value
          }
        }

        return object
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
