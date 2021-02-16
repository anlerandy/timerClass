# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - Ongoing Update

### Added

- Code documentation using JSdoc syntaxe.

## [1.0.7] - 2021-02-06

### Changed

- Some functions become inline.
- Initialisation of Weakmaps using `Array.map`.
- Start using "changelog".
- id.js' Function moved in helpers.

### Fixed

- Fix typos in recent README changes.
- Assigning value to `time` will fail if `String` is not Numeric only. F. Ex. `timer.time = '2000ei';` will fail.