const tap = require('tap');

tap.jobs = 1;

tap.test('Advanced tests', require('./common'));

tap.test('"Prototype" tests', require('./prototypes'));

tap.test('Advanced Verbose tests', require('./verbose'));

tap.test('Advanced Thread tests', require('./this'));