# Keep a Changelog tooling

Tooling to facilitate the linting and management of a changelog conforming to the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) spec.

> Heavily inspired by: [@brightcove/kacl](https://npm.im/@brightcove/kacl).

## Commands

### `kacl add <added | changed | deprecated | removed | fixed | security> [text]`

```
kacl add added [change]

Insert a added change in the unreleased version.

Positionals:
  change  The description of the change                                 [string]

Options:
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]
  --filename  The name of the changelog file to write  [default: "CHANGELOG.md"]

Hint: Make sure that you quote your change as a single shell string (ie: kacl
add added "Change text"). Note that if no change text is provided you will be
prompted to enter such text in your $EDITOR of choice.
```

### `kacl init`

```
kacl init

Initialize an empty CHANGELOG.md

Options:
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]
  --filename  The name of the changelog file to write  [default: "CHANGELOG.md"]
  --force     Overwrite an existing file, if it exists.                [boolean]
```

### `kacl lint`

```
kacl lint

Check the format of your changelog

Options:
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]
  --filename  The name of the changelog file to write  [default: "CHANGELOG.md"]

Hint: You should consider adding this as your posttest command in package.json.
```

### `kacl prerelease`

```
kacl prerelease

Check the requirements for creating a release

Options:
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]
  --filename  The name of the changelog file to write  [default: "CHANGELOG.md"]

Hint: You should consider adding this as your prerelease command in
package.json.
```

### `kacl release`

```
kacl release

Create a new release

Options:
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]
  --filename  The name of the changelog file to write  [default: "CHANGELOG.md"]

Hint you should consider adding the following as your version script in
package.json: kacl release && git add CHANGELOG.md
```

## Recommended configuration in `package.json`

```json
{
  "scripts": {
    "posttest": "kacl lint",
    "preversion": "kacl prerelease",
    "version": "kacl release && git add CHANGELOG.md"
  }
}
```

This workflow fits will with [`gh-release`](https://npm.im/gh-release). The following is the recommended configuration:

```json
{
  "scripts": {
    "posttest": "kacl lint",
    "preversion": "kacl prerelease",
    "version": "kacl release && git add CHANGELOG.md",
    "postversion": "git push && gh-release"
  }
}
```
