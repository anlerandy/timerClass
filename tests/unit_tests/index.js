const tap = require('tap');

// tap.jobs = 1;

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

// Verbose basic tests
require('./tests/verbose');

// Save & Destroy basic tests
require('./tests/save_destroy');

// Advanced tests
require('./tests/advanced');

// Leaks basic tests
// require('./tests/memory');