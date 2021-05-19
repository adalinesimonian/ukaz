import { camelCase } from './utilities.js'

/** Represents a command line arguments */
class Argument {
  /** Creates an argument from an argument definition, e.g. `<arg...>` */
  constructor (definition, description) {
    const argumentRegex = /^<([^<>]+)>$|^\[([^[\]]+)]$/

    const argumentMatch = argumentRegex.exec(definition)

    if (argumentMatch === null) {
      throw new Error(`Invalid argument definition '${definition}'`)
    }

    let name = (argumentMatch[1] || argumentMatch[2]).trim()
    const required = Boolean(argumentMatch[1])
    let variadic = false

    const variadicRegex = /\s?\.{3}$/

    const variadicMatch = variadicRegex.exec(name)

    if (variadicMatch !== null) {
      variadic = true
      name = name.slice(0, Math.max(0, variadicMatch.index))
    }

    this._name = name
    this._variableName = camelCase(name)
    this._description = description
    this._variadic = variadic
    this._required = required
  }

  toString () {
    return (this._required ? '<' : '[') +
      this._name +
      (this._variadic ? ' ...' : '') +
      (this._required ? '>' : ']')
  }
}

export default Argument
