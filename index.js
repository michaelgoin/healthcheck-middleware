'use strict';

var util = require('util');
var constants = require('./constants.js');

module.exports = function(options) {
	options = options || {};

	if(typeof options !== 'object') {
		throw new Error(constants.ErrorMessages.InvalidOptionsError);
	}

	var addChecks = options.addChecks || function (fail, pass) {
		pass();
	};

	var healthInfo = options.healthInfo || function (passInfo) {
		return passInfo;
	};

	if(typeof addChecks !== 'function') {
		throw new Error(util.format('%s: %s', constants.ErrorMessages.FunctionError, 'addChecks'));
	}

	if(typeof healthInfo !== 'function') {
		throw new Error(util.format('%s: %s', constants.ErrorMessages.FunctionError, 'healthInfo'));
	}

	return function(req, res) {
		try {
			addChecks(onFail, onPass);
		} catch(err) {
			onFail(err);
		}

		function onFail(err) {
			var failureInfo = {
				status: constants.Status.Failure
			};

			if(err) {
				failureInfo.message = err.message;
			}

			res.status(500).json(failureInfo);
		}

		function onPass(passInfo) {
			passInfo = passInfo || {};
			passInfo.status = passInfo.status || constants.Status.Success;
			passInfo.uptime = passInfo.uptime || process.uptime();
			passInfo.memoryUsage = passInfo.memoryUsage || process.memoryUsage();

			var info;
			try {
				info = healthInfo(passInfo) || {};

				if(typeof info !== 'object') {
					info = { message: info.toString() };
				}

			} catch(err) {
				info = {
					status: constants.Status.Success,
					warning: util.format('%s: %s', constants.ErrorMessages.HealthInfoError, err.message)
				};
			}

			res.status(200).json(info);
		}
	};
};
