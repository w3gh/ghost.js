import GHost from '../GHost';

const argv = require('yargs').config().argv;
const ghost = new GHost(argv);

ghost.start();