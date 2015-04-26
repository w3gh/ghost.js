'use strict';

var log = require('./../log');
var util = require('util');
var Bytes = require('./../Bytes');
var BaseGame = require('./BaseGame');
var _ = require('lodash');

function AdminGame() {
	BaseGame.call(this);
}

util.inherits(AdminGame, BaseGame);

module.exports = AdminGame;
