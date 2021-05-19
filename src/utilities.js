/** Utilities which provides shared functionality to other classes. */

/** Converts a hyphen- or space-separated name to camelCase. */
export function camelCase (name) {
  return name.split(/[\s-]+/).reduce((fragment, segment) =>
    `${fragment}${segment[0].toUpperCase()}${segment.slice(1)}`
  )
}
