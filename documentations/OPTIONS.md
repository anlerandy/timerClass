# Options

Type: `objects`

## **save**

Type: `Boolean`  
Default: `true`  
Save the instance in the Class. Can be retrieve using its `id` using `Timer.getById` method.  
Unsaved timers won't block new timers to use their `id`.

## **forceCreate**

Type: `Boolean`  
Default: `false`  
Prevent instanciation to fail due to already used `id`.  
`id` will be generated by the Class.

## **destroy**

Type: `Boolean`  
Default: `true`  
Destroy the instance to facilitate Garbage collecting upon termination, error included.  
Any getters will return `undefined` and methods won't be available anymore.

## **time**

**_Only used for `Timer.getById` options_**

Type: `Number`  
Default: `120000`  
The number of milliseconds to wait before timeout. Default is 2 minutes.  
Note: A 100 milliseconds is always added preventing premature timeout (default value included).  
This means that if it's set at 1000ms, the actual callback will be in 1100ms. Retrieving it will shows 1000ms.

## **id**

**_Only used for `new Timer` options_**

Type: `Number | String`  
Specify an`id` for the instance. `Throw` error if `id` already used and if `forceCreate` is `false`.  
An `id` will be applied if not specified.

### **createOne**

**_Only used for `Timer.getById` options_**

Type: `Boolean`  
Default: `true`  
Make the method create a new instance of Timer if not found.  
If `false`, no other options will be taken into account.  
Useful as `false` to see if a similar task is already running.

```javascript
function isRunning(id) {
  const timer = Timer.getById(id, { createOne: false });
  return !!timer?.inProgress;
}
```
