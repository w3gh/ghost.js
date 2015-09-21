import Ghost from './lib/Ghost';

const ghost = new Ghost();

// block for 50ms on all sockets - if you intend to perform any timed actions more frequently you should change this
// that said it's likely we'll loop more often than this
// due to there being data waiting on one of the sockets but there aren't any guarantees
const tick = () => {
	if (ghost.update()) {
		clearTimeout(id);
	} else {
		tick();
	}
};

const id = setTimeout(tick, 50);
