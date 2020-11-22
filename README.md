# Timer v1.0.4

Wrap a task in a timer in order to stop it upon its timeout.
Timer will be using a `callback` or its `promise.reject` upon timeout.  
Can also be used to schedule a task using a `callback` as the runner instead of the termination function.

Since the class saves its instances, it can freely retrieve and stop them from any scope. Also prevents running similar task when using `setTimeout` in a `setInterval` fashion.  
The class can also postpone the timeout if the task ping its wrapper: Timer.

# Install

`$ npm i @anlerandy/timer`

# Usage

```javascript
const Timer = require('@anlerandy/timer');

async function task() {
  return await doSomething();
}

async function main() {
  const timer = new Timer();
  const promise = task();
  try {
    return await timer.launchTimer(promise);
  } catch (error) {
    // Error could be due to timeout or from the promise returned by the task.
    throw error;
  }
}
```

# Class

## **new Timer(time?, options?)**

Instanciate a timer.

### **time**

Type: `Number`  
Default: `120000`  
The number of milliseconds to wait before timeout. Default is 2 minutes.  
Note: A 100 milliseconds is always added preventing premature timeout (default value included).

### **options**

Type: `objects`

#### id

Type: `Number | String`  
Specify a specific `id` for the instance. `Throw` error if `id` already used and if `forceCreate` is `false`.  
An `id` will be applied if not specified.

#### forceCreate

Type: `Boolean`  
Default: `false`  
Prevent instanciation to fail due to already use passed `id`. `id` will be generated by the Class.

#### destroy

Type: `Boolean`  
Default: `true`  
Upon termination, because of error included, destroy the instance to facilitate Garbage collecting.  
Any getters will return `undefined` and methods won't be available anymore.

#### save

Type: `Boolean`  
Default: `true`  
Save the instance in the Class. Can be retrieve using its `id` using `Timer.getById` method.  
Unsaved timers won't block new timers to use their `id`.

## **Timer.getById(id, options?)**

Return timer associated with `id`. Return `undefined` if no timer was found.  
If `createOne` is `true` in the options, create a new timer if not found. Could `throw` if timer creation fails.

```javascript
function timedTask() {
  const timer = Timer.getById('myTimerId');
  if (timer) return timer.launchTimer(task());
}
```

### **id**

Type: `Number | String`  
The `id` of the timer to find. Or the one to apply for creation.

### **options**

Type: `objects`  
Options of `_.getById` are similar of those in `new Timer()` in addition with the two following.

#### createOne

Type: `Boolean`  
Default: `true`  
Make the method create a new instance of Timer if not found. If `false`, no other options will be taken into account.  
Useful as `false` to see if a similar task is already running.

```javascript
function isRunning(id) {
  const timer = Timer.getById(id, { createOne: false });
  // return timer && timer.inProgress; // es6
  return !!timer?.inProgress;
}
```

#### time

See `time` option in `new Timer()`.

#### Other options

See `options` in `new Timer()`.

## **Timer.getAll()**

Return an array of all saved timer instances.

## **Timer.destroyAll(force?)**

Delete all saved timer instances that are not running.

### **force**

Type: `Boolean`  
Default: `false`  
`force` option aborts all running task before deleting them.

# Instance properties

All properties come from getter method. `console.log({ timer })` will show nothing.  
Spreading is still possible depending on your Node.js version: `const { _id, inProgress } = timer;`

Only `time` property can be set (`timer.time = 2000`). Will not be updated if value is not a number.  
Changing `time` while Timer is running can result in a timeout.

| Property      |   Type    |   Default   | Description                          |
| ------------- | :-------: | :---------: | ------------------------------------ |
| \_id          | `String`  |     N/A     | `id` of the instance                 |
| createdAt     |  `Date`   |     N/A     | Creation date                        |
| startedAt     |  `Date`   | `undefined` | Launch date                          |
| lastUpdate    |  `Date`   | `undefined` | Last update (i.e. last postpone)     |
| inProgress    | `boolean` |   `false`   | True if running                      |
| isAborted     | `boolean` |   `false`   | True if cancelled                    |
| isSelfAborted | `boolean` |   `false`   | True if the timer cancelled its task |
| time          | `Number`  |  `120100`   | Time to wait before timeout (ms)     |

All properties are `undefined` if the instance is being deleted.

```js
const timer = new Timer();
timer.destroy();
const date = timer.createdAt;
console.log(date);
// output: undefined
```

# Instance API

## **timer.launchTimer(callback, argument?)**

Run the timer. Depending on `callback`, returns nothing or a wrapped promise.

### **callback**

Type: `Function | Promise`  
A `function` that will run when time runs out. Or a `Promise` that will be rejected if time runs out.  
Passing a `function` involve that the timer should be terminate by user with `_.done()` or `_.abort()`.

```js
function task(callback) {
  try {
    // Do something before running callback
    callback(data);
  } catch (error) {
    callback({ error });
  }
}

(function () {
  const timer = new Timer();

  function callback(data) {
    if (timer.isAborted) return;
    else timer.done();
    // Do what should be done after task();
  }

  timer.launchTimer(callback);
  task(callback);
})();
```

### **argument**

Type: `Any`  
Default: `'TimeOut'`  
Argument will be passed to the callback. In the case of `promise`, the argument will be passed to the promise `reject` method.  
Only one argument can be passed.

```js
const myError = new Error('Task ran out of time');
try {
  const result = await timer.launchTimer(task(), myError);
  // runs out of time and trigger promise.reject(myError);
} catch (error) {
  console.log(error.message);
  // output: 'Task ran out of time'
}
```

## **timer.done()**

Terminate timer without triggering `callback` or `promise.reject`.  
If `destroy` option was `true` on instanciation, delete the timer.

## **timer.destroy()**

Destroy the instance. Throw an error if instance is not terminated via `_.done()` or `_.abort()`.  
Automaticaly called after temination, if `destroy` option was set as `true`.

## **timer.update()**

Reset the clock of timer.  
Useful if there is multiple task to be done, and each should be under the same timer.

```js
async function bigTask(timer) {
  for (i = 0; i < 10; i++) {
    await task();
    timer.update();
  }
}

(async function () {
  await timer.launchTimer(bigTask(timer));
  timer.done();
})();
```

## **timer.abort()**

Run `callback` or `promise.reject`. Then, work as `timer.done()`.
Can be used to terminate a task if the said task verify if timer is aborted.

```js
async function bigTask(timer) {
  for (i = 0; i < 10; i++) {
    if (timer.isAborted) break;
    // The following could be better if instance is set to be destroy after termination.
    // See timer.getById(id, { createOne }) example.
    // if (isRunning(timer)) break;
    await task();
    timer.update();
  }
}
```
