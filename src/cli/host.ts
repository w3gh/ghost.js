import * as readline from 'readline';
import {GHost} from '../GHost';

const readInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const argv = require('yargs').config().argv,
    ghost = new GHost(argv);

readInterface.on('line', (input) => {
    ghost.queueBNetsChatCommand(input);
});

ghost.start();
