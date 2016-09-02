
const winston = require('winston');

export const info = (...vars) => winston.log('info', ...vars);
export const debug = (...vars) => winston.log('debug', ...vars);