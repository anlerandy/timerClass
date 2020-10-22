const tap = require('tap');

tap.jobs = 5;

// id basic tests
require('./tests/get_id');

// Promises basic tests
require('./tests/promises');

// Update basic tests
require('./tests/update');

// Errors basic tests
require('./tests/errors');

// Getters basic tests
require('./tests/getters');

// Leaks basic tests
// require('./tests/memory');