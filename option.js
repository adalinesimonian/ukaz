const Utilities = require('./utilities')

/** Represents a command line option */
class Option {
  /**
   * Creates a new option from an option definition, e.g.
   * `-o|--option <value>`
   */
  constructor (definition, description, {
    default: defaultValue, multi = false
  } = {}) {
    const optionNameRegex = /-([^-\s|,])|--([^\s|,]+)/g
    const optionValueNameRegex = /\[([^[\]]*)\]|<([^<>]*)>|(\S+)/

    const shortNames = []
    const longNames = []
    let nameMatch
    let lastNameMatch
    while ((nameMatch = optionNameRegex.exec(definition)) !== null) {
      if (nameMatch[1]) {
        shortNames.push(nameMatch[1])
      } else {
        longNames.push(nameMatch[2])
      }
      lastNameMatch = nameMatch
    }

    if (shortNames.length === 0 && longNames.length === 0) {
      throw new Error(`Could not find option name in '${definition}'`)
    }

    const valueDefinition = definition.substr(
      lastNameMatch.index + lastNameMatch[0].length
    )

    const valueNameMatch = optionValueNameRegex.exec(valueDefinition)

    if (valueNameMatch === null) {
      throw new Error(`Could not find option value name in '${definition}'`)
    }

    const valueName = valueNameMatch[1] || valueNameMatch[2] || valueNameMatch[3]
    const required = Boolean(valueNameMatch[2])

    this._shortNames = shortNames
    this._longNames = longNames
    this._variableName = longNames.length > 0
      ? Utilities.camelCase(longNames[0])
      : shortNames[0]
    this._valueName = valueName
    this._description = description
    this._required = required
    this._multi = false
    this._default = defaultValue
  }

  toString () {
    return this._shortNames.map(sn => `-${sn}`)
      .concat(this._longNames.map(ln => `--${ln}`))
      .join(', ') +
      ' ' +
      (this._required ? '<' : '[') +
      this._valueName +
      (this._required ? '>' : ']')
  }
}

module.exports = Option
