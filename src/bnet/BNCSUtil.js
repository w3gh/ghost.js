'use strict';

var ref = require('ref');
var FFI = require('ffi');
var fs = require('fs');
var _ = require('lodash');

var gmp = FFI.Library('gmp');

var library = FFI.Library('libbncsutil', {
	// NLS: [],
	// getPublicKey: []
	bncsutil_getVersion: ['unsigned long']
});

/**
 *
 * @param {String} userName
 * @param {String} userPassword
 * @constructor
 */
function BNCSUtil(userName, userPassword) {
	// this.reset(userName, userPassword);
}

_.extend(BNCSUtil, {
	getVersion: function() {
		return library.bncsutil_getVersion();
	}
});

_.extend(BNCSUtil.prototype, {/** @lends BNCSUtil.prototype **/

	reset: function (userName, userPassword) {
		delete this.nls;
		this.nls = new library.NLS(userName, userPassword);
	},

	getExeInfo: function () {
		// code
	},

	HELP_SID_AUTH_CHECK: function (tft, war3Path, keyROC, keyTFT, valueStringFormula, mpqFileName, clientToken, serverToken) {
		var war3EXE = war3Path + 'war3.exe';
		var stormDLL = war3Path + 'Storm.dll';
		var gameDLL = war3Path + 'game.dll';

		var war3Exists = fs.existsSync(war3EXE);
		var stormDLLExists = fs.existsSync(stormDLL);
		var gameDLLExists = fs.existsSync(gameDLL);

		if (war3Exists && stormDLLExists && gameDLLExists) {
			// code
		}
	},

	HELP_SID_AUTH_ACCOUNTLOGON: function () {
		var buff = new Buffer(32);

		this.nls.getPublicKey(buff);

		this.clientKey = buff;

		return true;
	}
});

module.exports = BNCSUtil;
