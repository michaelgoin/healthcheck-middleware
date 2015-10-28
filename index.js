'use strict';

var util = require('util');
var errorMessages = require('./errorMessages.js');

module.exports = function(options) {
	options = options || {};

	if(typeof options !== 'object') {
		throw new Error(errorMessages.InvalidOptionsError);
	}

	var addChecks = options.addChecks || function (fail, pass) {
		pass();
	};

	var healthInfo = options.healthInfo || function (passInfo) {
		return passInfo;
	};

	if(typeof addChecks !== 'function') {
		throw new Error(util.format('%s: %s', errorMessages.FunctionError, 'addChecks'));
	}

	if(typeof healthInfo !== 'function') {
		throw new Error(util.format('%s: %s', errorMessages.FunctionError, 'healthInfo'));
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
			passInfo.memoryUsage = passInfo.memoryUsage || process.memoryUsage();

			var message;
			try {
				message = healthInfo(passInfo);
			} catch(err) {
				message = util.format('%s: %s', errorMessages.HealthInfoError, err.message);
			}

			res.status(200).json(message);
		}
	};
};
