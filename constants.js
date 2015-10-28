'use strict';

module.exports = {
	ErrorMessages: {
		HealthInfoError: 'Healthcheck passed but there was an error in healthInfo',
		FunctionError: 'Not a valid function',
		InvalidOptionsError: 'Invalid options. Must either pass in null or an object',	
	},
	Status: {
		Success: 'success',
		Failure: 'failure'
	}			
};