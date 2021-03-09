# Timer v^1.0.5

Add a timer to a promise by wrapping it.

# Install

`$ npm i @anlerandy/timer`

# Usage

## Promise

```javascript
const task = require('./my_asynchronous_function');
const Timer = require('@anlerandy/timer');

const promise = task();
const result = await new Timer(60000).launchTimer(promise);
```

<details>
  <summary>Instead of using a `setTimeout` code.</summary>
  
  ```js
    const task = require('./my_asynchronous_function');

    const promise = task();
    const result = await new Promise(function (resolve, reject) {
      const id = setTimeout(reject, 120000, 'Timeout');
      try {
        const result = await promise;
        resolve(result);
      } catch (error) {
        reject(error);
      }
      clearTimeout(id);
    })

````
</details>

---

## Callback

```javascript
  const task = require('./my_function');
  const Timer = require('@anlerandy/timer');

  const timer = new Timer();

  task(callback);
  launchTimer(onFailure); // Launch clock and calls onFailure if time runs out

  function callback(error) {
    timer.done(); // Stop the clock without calling onFailure
    if (error) {
      return onFailure();
    }
    // Do Something
  }

  function onFailure() {
    // Do Something
  }
```

# Class

## **new Timer([time](https://github.com/anlerandy/timerClass/blob/master/documentations/OPTIONS.md#time)?: number, [options](https://github.com/anlerandy/timerClass/blob/master/documentations/OPTIONS.md#options)?: object)**

Instanciate a timer set.
`time` parameter is in millisecond.

## **Timer.getById([id](https://github.com/anlerandy/timerClass/blob/master/documentations/OPTIONS.md#id): string, [options](https://github.com/anlerandy/timerClass/blob/master/documentations/OPTIONS.md#options)?: object)**

Return an instance of Timer by `id`.
Unless `options.createOne` is `true`, return `undefined` if no timer was found.
Could `throw` if timer creation fails.

```javascript
  const timer = Timer.getById('myTaskId');
  await timer.launchTimer(task());
```

## **Timer.getAll()**

Return an array of all saved timer instances.

## **Timer.destroyAll(force?: boolean)**

Delete all saved timer instances that are not running.

# Instance properties

Only `time` property can be set (`timer.time = 2000`). Will not be updated if value is not a number.
Changing `time` while Timer is running can result in a timeout.

| Property      |   Type    |   Default   | Description                          |
| ------------- | :-------: | :---------: | ------------------------------------ |
| \_id          | `String`  |     N/A     | `id` of the instance                 |
| createdAt     |  `Date`   |     N/A     | Creation date                        |
| startedAt     |  `Date`   | `undefined` | Launch date                          |
| lastUpdate    |  `Date`   | `createdAt` | Last update (i.e. last postpone)     |
| inProgress    | `boolean` |   `false`   | True if running                      |
| isAborted     | `boolean` |   `false`   | True if cancelled                    |
| isSelfAborted | `boolean` |   `false`   | True if the timer cancelled its task |
| time          | `Number`  |  `120000`   | Time to wait before timeout (ms)     |

All properties are `undefined` if the instance is being deleted.

```js
const timer = new Timer();
timer.destroy();
const date = timer.createdAt;
console.log(date);
// output: undefined
```

# Instance API

## **timer.launchTimer(callback: function | promise, argument?)**

Run the timer.
If `callback` argument is a function, it returns `undefined`.
If it's a `Promise`, it will return a `Promise`.

## **timer.done()**

Terminate timer without triggering `callback` or `promise.reject`.
If `destroy` option was `true` on instanciation, deletes the timer.

## **timer.destroy()**

Destroy the instance.
Throw an error if instance is not terminated via `_.done()` or `_.abort()`.
Automaticaly called after termination if `destroy` option was set as `true`.

## **timer.update()**

Reset the clock of timer.
Useful if there is multiple task to be done, and each should be under the same timer.

## **timer.abort()**

Run `callback` or `promise.reject`. Then, work as `timer.done()`.
Can be used to terminate a task if the said task verify if timer is aborted.
````
