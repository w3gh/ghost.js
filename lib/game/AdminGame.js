'use strict';

var log = require('./../log');
var util = require('util');
var Bytes = require('./../Bytes');
var BaseGame = require('./BaseGame');
var _ = require('lodash');

function AdminGame() {
	BaseGame.apply(this, arguments);
	this.virtualHostName = '|cFFC04040Admin';
}

util.inherits(AdminGame, BaseGame);

module.exports = AdminGame;
