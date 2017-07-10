# [![ukaz](ukaz-github-header.png)](https://github.com/vsimonian/ukaz)

Next-generation command line parser for Node.js

## Usage

> **API is currently under development and is therefore unstable.
> Changes may be made at any time.**

```javascript
const ukaz = require('ukaz')

const app = new ukaz.Application('Hello world CLI app')
  .helpFlag() // adds -h, --help
  .validate() // ensures all required arguments are given before running handler
  .arguments('[phrases...]')
  .flag('-s|--shout', 'Shouts hello instead of being polite')
  .option('-n, --name <name>', 'A name to say hello to instead of "world"', {
    default: 'world'
  })
  .handler(async ({flags, options, args}) => { // executed when the app runs
    let name = options.name.value
    if (flags.shout) {
      console.log(`HELLO, ${name.toUpperCase()}!!!`)
    } else {
      console.log(`Hello, ${name}!`)
    }
    if (args.phrases.present) {
      args.phrases.value.forEach(phrase => console.log(phrase))
    }
  })

app.run(process.argv)
  .catch(err => { // catches any errors encountered during execution
    if (err instanceof ukaz.CliParsingError) { // bad arguments or user input
      console.error(`Error: ${err.message}`)
    } else { // other application error
      console.error(err)
    }
  })
```

## Another CLI app framework? But we already have [other framework]!

There are some great toolkits out there already, such as [commander.js](https://github.com/tj/commander.js) and [nash](https://github.com/scottcorgan/nash). But most CLI frameworks for Node.js are not currently taking advantage of Node's support for `async`/`await` which can make your CLI app more robust.

ukaz intends to correct that:

- **All handlers are `async` functions.**
- Use `async` support to easily write synchronous or asynchronous code without unnecessary boilerplate.
- All errors are safely bubbled up to your error-handling code when you call `app.run(...)`. Handle errors your way!
- You terminate the process on your own terms. No surprise `process.exit(...)` calls.
- Chain handlers together, much like middleware. Useful for larger, more involved applications.

## Licence

MIT
