import {GProxy} from '../GProxy';

const argv = require('yargs').config().argv;
const gproxy = new GProxy(argv);

gproxy.start();