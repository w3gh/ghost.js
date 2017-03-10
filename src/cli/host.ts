import {GHost} from '../GHost';

const argv = require('yargs').config().argv,
    ghost = new GHost(argv);

ghost.start();