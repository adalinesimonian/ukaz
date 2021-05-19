import Argument from './argument.js'

/** Represents a set of command line arguments */
export default class ArgumentSet {
  /**
   * Creates an argument set from a definition, e.g.
   * `<arg1>..<arg2> [arg3...]`
   */
  constructor (definition) {
    const argumentRegex = /<[^<>]+>|\[[^[\]]+]/g

    const args = []

    let argumentMatch
    const argMap = new Map()
    let lastArg
    let lastArgMatch
    let variadicExists = false
    while ((argumentMatch = argumentRegex.exec(definition)) !== null) {
      if (lastArg && lastArg._variadic) {
        throw new Error(`Variadic argument must come last: '${definition}'`)
      }

      const arg = new Argument(argumentMatch[0])
      if (lastArgMatch) {
        const delimStart = lastArgMatch.index + lastArgMatch[0].length
        const delimiter = definition.slice(delimStart, argumentMatch.index)
        if (/^\s+$/.test(delimiter)) {
          args.push(' ')
        } else {
          if (lastArg._required !== arg._required) {
            throw new Error(
              'Arguments separated with custom delimiters must both be' +
              `required or both be optional: ${definition}`)
          }

          args.push(delimiter)
        }
      }

      if (variadicExists && arg._variadic) {
        throw new Error(
          `Argument set can only have one variadic argument: '${definition}'`
        )
      }

      if (argMap.has(arg._variableName)) {
        throw new Error(
          `Argument set contains duplicate argument '${arg._name}': '${
            definition}'`
        )
      }

      args.push(arg)
      argMap.set(arg._variableName, true)
      lastArg = arg
      lastArgMatch = argumentMatch
      variadicExists = arg._variadic
    }

    this._arguments = args
  }

  toString () {
    return this._arguments.reduce((args, arg) => args + arg, '')
  }
}
