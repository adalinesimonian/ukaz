const Utilities = require('./utilities')

/** Represents a command line flag */
class Flag {
  /**
   * Creates a new flag from a flag definition, e.g. `-f|--flag`
   */
  constructor (definition, description, {variableName} = {}) {
    const flagNameRegex = /-([^-\s|,])|--([^\s|,]+)/g

    const shortNames = []
    const longNames = []
    let nameMatch
    let lastNameMatch
    while ((nameMatch = flagNameRegex.exec(definition)) !== null) {
      if (nameMatch[1]) {
        shortNames.push(nameMatch[1])
      } else {
        longNames.push(nameMatch[2])
      }
      lastNameMatch = nameMatch
    }

    if (shortNames.length === 0 && longNames.length === 0) {
      throw new Error(`Could not find flag name in '${definition}'`)
    }

    const valueDefinition = definition.substr(
      lastNameMatch.index + lastNameMatch[0].length
    )

    if (valueDefinition && valueDefinition.replace(/\s/g, '')) {
      throw new Error(`Flags do not support values: '${definition}'`)
    }

    this._shortNames = shortNames
    this._longNames = longNames
    this._variableName = variableName || (longNames.length > 0
      ? Utilities.camelCase(longNames[0])
      : shortNames[0])
    this._description = description
    this._multi = false
  }

  toString () {
    return this._shortNames.map(sn => `-${sn}`)
      .concat(this._longNames.map(ln => `--${ln}`))
      .join(', ')
  }
}

module.exports = Flag
