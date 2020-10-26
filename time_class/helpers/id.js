function validateId(id) { 
	if (typeof id !== 'string' && typeof id !== 'number') throw new TypeError('`_id` must be a String or a Number.');
	if (!id) throw new TypeError('`_id` must not be an empty String or equal to 0.');
}

module.exports = validateId;