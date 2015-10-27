'use strict';

var util = require('util');

var HealthInfoError = 'Healthcheck passed but there was an error in healthInfo';
var FunctionError = 'Not a valid function';

module.exports = function(options) {
	options = options || {};

	var addChecks = options.addChecks || function (fail, pass) {
		pass();
	};

	var healthInfo = options.healthInfo || function (passInfo) {
		return passInfo;
	};

	if(typeof addChecks !== 'function') {
		throw new Error(util.format('%s: %s', FunctionError, 'addChecks'));
	}

	if(typeof healthInfo !== 'function') {
		throw new Error(util.format('%s: %s', FunctionError, 'healthInfo'));
	}

	return function(req, res) {
		try {
			addChecks(onFail, onPass);
		} catch(err) {
			onFail(err);
		}

		function onFail(err) {
			res.status(500).json({status: 'FAILURE', message: err.message});
		}

		function onPass(passInfo) {
			passInfo = passInfo || {};
			passInfo.status = passInfo.status || 'SUCCESS';
			passInfo.uptime = passInfo.uptime || process.uptime();
			passInfo.memoryUsage = passInfo.uptime || process.memoryUsage();

			var message;
			try {
				message = healthInfo(passInfo);
			} catch(err) {
				message = util.format('%s: %s', HealthInfoError, err.message);
			}

			res.status(200).json(message);
		}
	};
};