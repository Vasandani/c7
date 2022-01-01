# Contributing

We're accepting contributions!

Unfortunately, we don't have any tests yet. If you'd like to add some, please [open an issue](https://github.com/svasandani/c7/issues)!

## Debugging

The best way to debug `c7` is to use the `dev` script, and pass it parameters as needed:

```bash
$ npm run dev -- <action> <id> [<options> ...]
```

This will build the CLI and run it.

If you want to test it in a separate repository, make sure you're in the `c7` repository and install it globally:

```bash
$ npm install . -g
```

Then, navigate to the test repo and call it normally:

```bash
c7 <action> <id> [<options> ...]
```

You can uninstall it at any time with the following command:

```bash
npm uninstall c7 -g
```