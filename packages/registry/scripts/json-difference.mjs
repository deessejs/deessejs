export function findDifference(expected, actual, path = "$") {
  if (Object.is(expected, actual)) return null
  if (Array.isArray(expected) || Array.isArray(actual)) {
    return findArrayDifference(expected, actual, path)
  }
  if (isObject(expected) || isObject(actual)) {
    return findObjectDifference(expected, actual, path)
  }
  return { path, expected, actual }
}

function findArrayDifference(expected, actual, path) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    return { path, expected, actual }
  }
  if (expected.length !== actual.length) {
    return { path, expected: expected.length, actual: actual.length }
  }

  for (let index = 0; index < expected.length; index += 1) {
    const difference = findDifference(
      expected[index],
      actual[index],
      `${path}[${index}]`
    )
    if (difference) return difference
  }
  return null
}

function findObjectDifference(expected, actual, path) {
  if (!isObject(expected) || !isObject(actual)) {
    return { path, expected, actual }
  }

  const keys = [
    ...new Set([...Object.keys(expected), ...Object.keys(actual)]),
  ].sort()
  for (const key of keys) {
    if (!Object.hasOwn(expected, key) || !Object.hasOwn(actual, key)) {
      return {
        path: `${path}.${key}`,
        expected: expected[key],
        actual: actual[key],
      }
    }
    const difference = findDifference(
      expected[key],
      actual[key],
      `${path}.${key}`
    )
    if (difference) return difference
  }
  return null
}

function isObject(value) {
  return value !== null && typeof value === "object"
}
