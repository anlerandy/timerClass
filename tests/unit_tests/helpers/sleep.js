const sleep = (time) => new Promise((res) => {
  if (typeof time !== 'number') throw new Error('Time must be a number.');
  setTimeout(res, time, time)
});

module.exports = sleep;