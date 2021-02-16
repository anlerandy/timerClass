const initLogger = require('./log');

function validateId(id) { 
  if (typeof id !== 'string' && typeof id !== 'number') throw new TypeError('`_id` must be a String or a Number.');
  if (!id) throw new TypeError('`_id` must not be an empty String or equal to 0.');
}

function isFunction(fn) {
  return {}.toString.call(fn) === '[object Function]'
};

module.exports = { isFunction, validateId, initLogger };
