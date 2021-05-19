import test from 'ava'
import * as Utilities from '../src/utilities.js'

test('should camelCase hyphenated strings', t => {
  t.is(
    Utilities.camelCase('hello-world'),
    'helloWorld'
  )
})

test('should camelCase spaced strings', t => {
  t.is(
    Utilities.camelCase('hello world'),
    'helloWorld'
  )
})
