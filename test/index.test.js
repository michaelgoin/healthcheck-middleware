/*global describe, it, beforeEach, afterEach*/
/*jshint expr: true*/
'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

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

		it('responds with status 500 when error thrown', function() {
			var customChecks = function() {
				throw new Error('BOOM');
			};

			healthcheck({addChecks: customChecks})(req, res, next);
			res.status.should.have.been.calledWith(500);
		});

		it('responds with json containing status:FAILURE and error message when error thrown', function() {
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

	describe('healthInfo', function() {
		//var req, res, next;
		
		it('throws FunctionError if healthInfo is not a function', function() {
			var check = function() {
				healthcheck({healthInfo: 'blah'});	
			};
			
			check.should.Throw(errorMessages.FunctionError);
		});

	});


});