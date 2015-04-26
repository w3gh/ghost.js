'use strict';

var log = require('./../log');
var util = require('util');
var Bytes = require('./../Bytes');
var BaseGame = require('./BaseGame');
var _ = require('lodash');

function Game() {
	BaseGame.call(this);
}

util.inherits(Game, BaseGame);

module.exports = Game;
