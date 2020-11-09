# Timer v1.0.3

Wrap a task in a timer that be stoped using a `callback` or its `promise.reject` upon timeout.  
Can also be use to schedule a task using `callback` as the runner instead of the stopper.

This timer can be saved accross an app and manualy stopped. Prevent running other similar task when using `setTimeout` in a `setInterval` fashion.  
Most importantly, the class can postponed the timeout if the task ping its wrapper: Timer.

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

# API

## new Timer(time?, options?)

Instanciate a timer.

### time

Type: `Number`  
Default: `120000`  
The number of milliseconds to wait before timeout. Default is 2 minutes.  
Note: A 100 milliseconds is always added preventing premature timeout (default value included).

### options

Type: `objects`

#### id

---

Type: `Number | String`  
Specify a specific `id` for the instance. `Throw` error if `id` already used and if `forceCreate` is `false`.  
An `id` will be applied if not specified.

#### forceCreate

---

Type: `Boolean`  
Default: `false`  
Prevent instanciation to fail due to already use passed `id`. `id` will be generated by the Class.

#### destroy

---

Type: `Boolean`  
Default: `true`  
Upon termination, due to error included, destroy the instance to facilitate Garbage collecting.  
Any getters will return `undefined` and methods won't be avalaible anymore.

#### save

---

Type: `BOolean`  
Default: `true`  
Save the instance in the Class. Can be retrieve using its `id` in the whole app using `Timer.getById` method.  
Unsaved timers won't block new timers to use their `id`.

#### verbose

---

Type: `Number`  
Default: `0`  
Activate logs for methods.
1: Logs when `done` & `abort` are called.
2: 1 plus when `launch*` is called.
3: 2 plus when `update` is called.
10: Add timer id before every log.
20: 10 plus date of the log.
30: 20 plus timestamp of next timeout.

#### log

---

Type: `Function`  
Prototype: `logger(...logs)`  
Default: `console.log`
