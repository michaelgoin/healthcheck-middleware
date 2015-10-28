'use strict';
/*global describe, it, beforeEach, afterEach*/
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
			req = {};
			res = {
				status: sinon.stub(),
				json: sinon.stub()
			};
			res.status.returns(res);

			next = {};

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
			req = undefined;
			res = undefined;
			next = undefined;
			uptime = undefined;
			memory = undefined;

			process.uptime.restore();
			process.memoryUsage.restore();
		});
		
		it('responds with 200 status', function() {
			healthcheck()(req, res, next);
			res.status.should.have.been.calledWith(200);
		});

		it('returns json with SUCCESS, uptime and memoryUsage', function() {
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

		it('throws FunctionError if addChecks is not a function', function() {
			var check = function() {
				healthcheck({addChecks: 'blah'});	
			};
			
			check.should.Throw(errorMessages.FunctionError);
		});

		it('throws FunctionError if healthInfo is not a function', function() {
			var check = function() {
				healthcheck({healthInfo: 'blah'});	
			};
			
			check.should.Throw(errorMessages.FunctionError);
		});
		
	});


});