# TypeScript Library Template

> Opinionated template repository for creating a TypeScript library 

This repository is designed to be cloned via [degit](https://npm.im/degit) or using the [Template Repository feature](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template#about-repository-templates) of GitHub.

## Initial set-up

```shell
npx degit ggoodman/typescript-library-template new-project-name
cd new-project-name
npm install
```

## Testing

This repository uses [jest](https://npm.im/jest) with [ts-jest](https://npm.im/jest) for running tests authored in TypeScript.

```sh
npm test
```

Tests can be run in watch mode by passing in the `--watch` flag:

```sh
npm test -- --watch
```

## Building

This repository generates both CommonJS and ESM builds that should be suitable for using in popular bundlers and even with Node.js' [Package Entry Points](https://nodejs.org/api/packages.html#packages_package_entry_points). Builds are produced using [Rollup](https://rollupjs.org), coupled with the excellent [@wessberg/rollup-plugin-ts](https://npm.im/@wessberg/rollup-plugin-ts) to produce tree-shaken type definitions.

> **Important**: By default, this library will NOT bundle dependencies.

```sh
npm run generate
```

