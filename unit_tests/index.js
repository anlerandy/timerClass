const tap = require('tap');

tap.jobs = 2;

// Promises basic tests
require('./tests/promises');

// Update basic tests
require('./tests/update');