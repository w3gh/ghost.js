'use strict';

var Ghost = require('./lib/Ghost');

var g = new Ghost();

// block for 50ms on all sockets - if you intend to perform any timed actions more frequently you should change this
// that said it's likely we'll loop more often than this due to there being data waiting on one of the sockets but there aren't any guarantees

var id = setInterval(function () {
	if (g.update()) {
		clearInterval(id);
	}
}, 50);

/**
var BNet = require('./lib/BNet');
var bn = new BNet('server.eurobattle.net', 'eurobattle', 6112);

bn.run();
*/
