'use strict';

var _ = require('lodash');

function Config() {
}

_.extend(Config.prototype, {
	get: function (value, defaultValue) {
		return defaultValue;
	}
});

module.exports = Config;
