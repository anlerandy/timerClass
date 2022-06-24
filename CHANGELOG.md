# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.12] - 2022-06-24

### Added

- `_tick` verbose.

### Fixed

- Unexpected increase of timeout due date.

## [1.0.8] - 2021-03-19

### Added

- Code documentation using JSdoc syntaxe.

### Changed

- Readme.

### Fixed

- Wrong message error when passing Timer.prototype.launchTimer to a cron function (setTimeout, setInterval, Timer.prototype.launchTimer)
- Crash when passing Timer prototypes (update, abort, done) to a cron function. Now, it ignores the call.

## [1.0.7] - 2021-02-06

### Changed

- Some functions become inline.
- Initialisation of Weakmaps using `Array.map`.
- Start using "changelog".
- id.js' Function moved in helpers.

### Fixed

- Fix typos in recent README changes.
- Assigning value to `time` will fail if `String` is not Numeric only. F. Ex. `timer.time = '2000ei';` will fail.
