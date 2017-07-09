/** Utility class which provides shared functionality to other classes. */
class Utilities {
  /** Converts a hyphen- or space-separated name to camelCase. */
  static camelCase (name) {
    return name.split(/[\s-]+/).reduce((fragment, segment) =>
      `${fragment}${segment[0].toUpperCase()}${segment.substr(1)}`
    )
  }
}

module.exports = Utilities
