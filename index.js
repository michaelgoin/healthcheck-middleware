'use strict';

module.exports = function(options) {
	var FunctionError = 'Not a valid function';
	options = options || {};

	var addChecks = options.addChecks || function (fail, pass) {
		pass();
	};

	var healthInfo = options.healthInfo || function (passInfo) {
		return passInfo;
	};

	if(typeof addChecks !== 'function') {
		throw new Error(FunctionError + ': addChecks');
	}

	if(typeof healthInfo !== 'function') {
		throw new Error(FunctionError + ': healthInfo');
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

			passInfo.uptime = process.uptime();
			passInfo.memoryUsage = process.memoryUsage();

			var message = healthInfo(passInfo);
			res.status(200).json(message);
		}
	};
};