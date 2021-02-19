# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- Introduce NPM shields in the README. (#1)
- Duplicate all of the previous `kacl add <command>` commands as top-level commands (ie: `kacl <command>`).
  
  These commands are the most typed (by far) and should therefore the easiest to access. To avoid making this a breaking change, these commands remain available underneath `kacl add`.

### Fixed
- Fix npm module name in README shields. (#2)

## 1.0.0 - 2021-01-26
### Added
- Initial release

[Unreleased]: https://github.com/ggoodman/kacl/compare/v1.0.0...HEAD
