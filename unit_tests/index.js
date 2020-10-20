const tap = require('tap');

tap.jobs = 3;

// id basic tests
require('./tests/get_id');

// Promises basic tests
require('./tests/promises');

// Update basic tests
require('./tests/update');