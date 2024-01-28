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

if (process.env.NODE_ENV === 'test') {
    setTimeout(() => {
       ghost.exit();
    }, 3000);
}

process.on('uncaughtException', error => {
    console.error(error)
})

process.on('SIGINT', () => {
    console.info('SIGINT signal received.')
    ghost.exit();
    process.exit(2)
})

process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.')
    ghost.exit();
    process.exit(2)
})
