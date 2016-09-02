import GHost from '../GHost';

const argv = require('yargs').config().argv;
const ghost = GHost.run(argv);

process.nextTick(() => {
	if (ghost.update()) {
		process.exit();
	}
});