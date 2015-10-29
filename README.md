# healthcheck-middleware
Express middleware for rendering a JSON healthcheck page. Provides simple default functionality, ability to add additional checks and ability to change displayed health info.

```bash
$ npm install healthcheck-middleware
```
```js
var healthcheck = require('healthcheck-middleware');
```
## healthcheck([options])
Returns healthcheck middleware using the given options. The middleware will return a JSON response with status 200 on success or status 500 on `addChecks` failure (see addChecks).

```js
app.use('/healthcheck', healthcheck());
```
> {status: 'success', uptime: 3, memoryUsage: {rss: 32587776, heapTotal: 29604500, heapUsed: 14572104}}

## options
These properties can be passed as a part of the `options` object:
* `addChecks`
* `healthInfo`

### addChecks
A function that allows the addition of checks to the healthcheck. The function is called as `addChecks(fail, pass)`. You will call `fail()` or `pass()` depending on your desired state.

addChecks will also catch a thrown Error but the preferred method is to call `fail()`.

```js
module.exports = healthcheck({
	addChecks: function(fail, pass) {
		store.getDatabaseInfoAsync()
		.then(function(databaseInfo) {
			pass(databaseInfo);
		})
		.catch(function() {
			fail(new Error('could not connect to database'));
		});
	}
});
```

#### fail
Call `fail()` when the intent is the for the healthcheck to fail. Fail accepts an Error as an argument. Calling fail will result in a status 500 and a JSON message indicating failure with the error message.

##### Example 1
```js
fail();
```
> {status: 'failure'}

##### Example 2
```js
fail(new Error('some error'));
```
> {status: 'failure', message: 'some error'}


#### pass
Call `pass()` when the intent is for the healthcheck to pass. Pass can be called with a JSON object that specifies additional properties to display with the health information. Calling pass will result in a status 200 and JSON message that indicates success, process.uptime(), process.memoryUsage(), and any custom properties.

If you return properties called status, uptime or memoryUsage they will override the standard values returned.

##### Example 1
```js
pass();
```
> {status: 'success', uptime: 3, memoryUsage: {rss: 32587776, heapTotal: 29604500, heapUsed: 14572104}}

##### Example 2
```js
var databaseInfo = {
	region: 'us-west',
	status: 'ACTIVE'
};

pass({database: databaseInfo});
```
> {database: {region: 'us-west', status: 'ACTIVE'}, status: 'success', uptime: 3, memoryUsage: {rss: 32587776, heapTotal: 29604500, heapUsed: 14572104}}

##### Example 3
```js
pass({status: 'WORKED!'});
```
> {status: 'WORKED!', uptime: 3, memoryUsage: {rss: 32587776, heapTotal: 29604500, heapUsed: 14572104}}

### healthInfo
A function that allows customization of the displayed health information. The function is called as `healthInfo(passInfo)`. The `passInfo` parameter contains the health information that would normally be displayed (see examples above). You will return the JSON representation of the health info you want rendered. You may also return a string which will be converted into a JSON object `{message: string}`.

##### Example 1
```js
module.exports = healthcheck({
	healthInfo: function(passInfo) {
		return {
			status: passInfo.status,
			server: os.hostname(),
			version: process.env.APP_VERSION
		};
	}
});
```
> {status: 'success', server: 'theServer', version: '1.0.0'}

##### Example 2
```js
module.exports = healthcheck({
	healthInfo: function(passInfo) {
		return 'This is not particularly helpful.'
	}
});
```
> {message: 'This is not particularly helpful.'}

### All Options Example
```js
module.exports = healthcheck({
	addChecks: function(fail, pass) {
		store.getDatabaseInfoAsync()
		.then(function(databaseInfo) {
			pass(databaseInfo);
		})
		.catch(function() {
			fail(new Error('could not connect to database'));
		});
	},

	healthInfo: function(passInfo) {
		return {
			status: passInfo.status,
			server: os.hostname(),
			version: process.env.APP_VERSION,
			databaseRegion: passInfo.database.region,
			databaseStatus: passInfo.database.status
		};
	}
});
```
> {status: 'success', server: 'theServer', version: '1.0.0', databaseRegion: 'us-west', databaseStatus: 'ACTIVE'}
