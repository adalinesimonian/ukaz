import test from 'ava'
import Utilities from '../src/utilities'

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
