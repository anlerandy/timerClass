const isProd = process.env.ISPROD === 'true';

/**
 * @name Timer
 * @type {import("../time_class")}
 */
const Timer = require(isProd ? '../time_class' : '../index');

/**
 * @name Timer
 * @type {import("../time_class")}
 */
module.exports = Timer;
