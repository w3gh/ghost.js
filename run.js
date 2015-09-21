const GHost = require('./lib/GHost');
const ghost = new GHost();

// block for 50ms on all sockets - if you intend to perform any timed actions more frequently you should change this
// that said it's likely we'll loop more often than this
// due to there being data waiting on one of the sockets but there aren't any guarantees
const tick = function tick() {
	if (ghost.update()) {
		clearTimeout(id);
	}
};

const id = setInterval(tick, 50);