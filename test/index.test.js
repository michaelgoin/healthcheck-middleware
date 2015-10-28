/*global describe, it, beforeEach, afterEach*/
/*jshint expr: true*/
'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var util = require('util');

var healthcheck = require('..');
var errorMessages = require('../errorMessages.js');

chai.use(sinonChai);
chai.should();

describe('healthcheck-middleware', function() {

	describe('default', function() {
		var req, res, next;
		var uptime;
		var memory;

		beforeEach(function() {
			res = {
				status: sinon.stub(),
				json: sinon.stub()
			};
			res.status.returns(res);

			uptime = 999;
			memory = {
				rss: 50, 
				heapTotal: 51,
				heapUsed: 52,
			};

			sinon.stub(process, 'uptime').returns(uptime);
			sinon.stub(process, 'memoryUsage').returns(memory);
		});

		afterEach(function() {
			res = undefined;
			uptime = undefined;
			memory = undefined;

			process.uptime.restore();
			process.memoryUsage.restore();
		});
		
		it('responds with 200 status', function() {
			healthcheck()(req, res, next);
			res.status.should.have.been.calledWith(200);
		});

		it('responds with json containing status:SUCCESS, uptime and memoryUsage', function() {
			var expected = {
				status: 'SUCCESS',
				uptime: uptime,
				memoryUsage: memory
			};

			healthcheck()(req, res, next);
			res.json.should.have.been.calledWith(expected);
		});


		it('throws InvalidOptionsError if options parameter is not null and not an object', function() {
			var check = function() {
				healthcheck('woo');	
			};
			
			check.should.Throw(errorMessages.InvalidOptionsError);
		});
		
	});

	describe('addChecks', function() {
		var req, res, next;

		beforeEach(function() {
			res = {
				status: sinon.stub(),
				json: sinon.stub()
			};
			res.status.returns(res);
		});

		afterEach(function() {
			res = undefined;
		});
		

		it('throws FunctionError if addChecks is not a function', function() {
			var check = function() {
				healthcheck({addChecks: 'blah'});	
			};
			
			check.should.Throw(errorMessages.FunctionError);
		});


		it('executes provided addChecks', function() {
			var customChecks = sinon.spy();
			healthcheck({addChecks: customChecks})(req, res, next);

			customChecks.should.have.been.calledOnce; 
		});

		describe('when error thrown', function() {
			it('responds with status 500', function() {
				var customChecks = function() {
					throw new Error('BOOM');
				};

				healthcheck({addChecks: customChecks})(req, res, next);
				res.status.should.have.been.calledWith(500);
			});

			it('responds with json containing status:FAILURE and error message', function() {
				var errorMessage = 'BOOM';
				var expected = {
					status: 'FAILURE',
					message: errorMessage
				};

				var customChecks = function() {
					throw new Error(errorMessage);
				};

				healthcheck({addChecks: customChecks})(req, res, next);
				res.json.should.have.been.calledWith(expected);
			});
		});

		describe('when fail called', function() {
			it('responds with status 500', function() {
				var customChecks = function(fail) {
					fail();
				};

				healthcheck({addChecks: customChecks})(req, res, next);
				res.status.should.have.been.calledWith(500);
			});

			
			it('responds with json containing status:FAILURE and error message from parameter', function() {
				var errorMessage = 'BOOM';
				var expected = {
					status: 'FAILURE',
					message: errorMessage
				};

				var customChecks = function(fail) {
					fail(new Error(errorMessage));
				};

				healthcheck({addChecks: customChecks})(req, res, next);
				res.json.should.have.been.calledWith(expected);
			});
			
		});

		describe('when pass called', function() {
			var uptime;
			var memory;

			beforeEach(function() {
				uptime = 999;
				memory = {
					rss: 50, 
					heapTotal: 51,
					heapUsed: 52,
				};

				sinon.stub(process, 'uptime').returns(uptime);
				sinon.stub(process, 'memoryUsage').returns(memory);
			});

			afterEach(function() {
				uptime = undefined;
				memory = undefined;

				process.uptime.restore();
				process.memoryUsage.restore();
			});


			it('responds with status 200', function() {
				var customChecks = function(fail, pass) {
					pass();
				};

				healthcheck({addChecks: customChecks})(req, res, next);
				res.status.should.have.been.calledWith(200);
			});

			describe('without custom pass info', function() {
				it('responds with json containing status:SUCCESS, uptime and memoryUsage', function() {
					var expected = {
						status: 'SUCCESS',
						uptime: uptime,
						memoryUsage: memory
					};

					var customChecks = function(fail, pass) {
						pass();
					};

					healthcheck({addChecks: customChecks})(req, res, next);

					res.json.should.have.been.calledWith(expected);
				});
			});

			describe('with custom pass info', function() {
				it('responds with json containing custom pass info + status:SUCCESS, uptime and memoryUsage', function() {
					var customPassInfo = {
						custom: 'yes'
					};

					var expected = {
						custom: 'yes',
						status: 'SUCCESS',
						uptime: uptime,
						memoryUsage: memory
					};

					var customChecks = function(fail, pass) {
						pass(customPassInfo);
					};

					healthcheck({addChecks: customChecks})(req, res, next);

					res.json.should.have.been.calledWith(expected);
				});

				it('responds with json containing custom pass info overrides of default values for status, uptime and memoryUsage', function() {
					var customPassInfo = {
						custom: 'yes',
						status: 'YES',
						uptime: 1000,
						memoryUsage: 1001
					};

					var expected = {
						custom: customPassInfo.custom,
						status: customPassInfo.status,
						uptime: customPassInfo.uptime,
						memoryUsage: customPassInfo.memoryUsage
					};

					var customChecks = function(fail, pass) {
						pass(customPassInfo);
					};

					healthcheck({addChecks: customChecks})(req, res, next);

					res.json.should.have.been.calledWith(expected);
				});
			});
		});
	});

	

	describe('healthInfo', function() {
		var req, res, next;

		beforeEach(function() {
			res = {
				status: sinon.stub(),
				json: sinon.stub()
			};
			res.status.returns(res);
		});

		afterEach(function() {
			res = undefined;
		});
		
		it('throws FunctionError if healthInfo is not a function', function() {
			var check = function() {
				healthcheck({healthInfo: 'blah'});	
			};
			
			check.should.Throw(errorMessages.FunctionError);
		});

		it('executes provided healthInfo', function() {
			var customHealthInfo = sinon.spy();
			healthcheck({healthInfo: customHealthInfo})(req, res, next);

			customHealthInfo.should.have.been.calledOnce; 
		});

		it('renders returned json', function() {
			var returnData = {
				whereAmI: 'no here',
				status: 'YES',
				uptime: 1000,
				memoryUsage: 1001
			};

			var customHealthInfo = function() {
				return returnData;
			};

			healthcheck({healthInfo: customHealthInfo})(req, res, next);

			res.json.should.have.been.calledWith(returnData);
		});

		describe('when error thrown', function() {
			var uptime;
			var memory;

			beforeEach(function() {
				uptime = 999;
				memory = {
					rss: 50, 
					heapTotal: 51,
					heapUsed: 52,
				};

				sinon.stub(process, 'uptime').returns(uptime);
				sinon.stub(process, 'memoryUsage').returns(memory);
			});

			afterEach(function() {
				uptime = undefined;
				memory = undefined;

				process.uptime.restore();
				process.memoryUsage.restore();
			});

			it('responds with status 200', function() {
				var customHealthInfo = function() {
					throw new Error('BOOM');
				};

				healthcheck({healthInfo: customHealthInfo})(req, res, next);
				res.status.should.have.been.calledWith(200);
			});

			
			it('responds with json containing status:SUCCESS and warning message', function() {
				var errorMessage = 'BOOM';
				var expected = {
					status: 'SUCCESS',
					warning: util.format('%s: %s', errorMessages.HealthInfoError, errorMessage)
				};

				var customHealthInfo = function() {
					throw new Error(errorMessage);
				};

				healthcheck({healthInfo: customHealthInfo})(req, res, next);
				res.json.should.have.been.calledWith(expected);
			});
			
		});

	});


});