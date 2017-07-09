# ![ukaz](ukaz-logo@100px.png)

Next-generation command line parser for Node.js

## Usage

> **API is currently under development and is therefore unstable.
> Changes may be made at any time.**

```javascript
const ukaz = require('ukaz')

const app = new ukaz.Application('Hello world CLI app')
  .helpFlag() // adds -h, --help
  .validate() // ensures all required arguments are given before running handler
  .flag('-s|--shout', 'Shouts hello world instead of being polite')
  .option('-n, --name [name]', 'A name to say hello to instead of "world"')
  .handler(async ctx => { // executed when the application runs
    let name = ctx.args.name || 'world'
    if (ctx.args.shout) {
      console.log(`HELLO, ${name.toUpperCase()}!!!`)
    } else {
      console.log(`Hello, ${name}!`)
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

## License

MIT
