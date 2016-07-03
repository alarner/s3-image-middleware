let expect = require('chai').expect;
let store = require('../src/store');

describe('store', function() {
	it('should exits', function() {
		expect(store).to.be.a('function');
	});
});