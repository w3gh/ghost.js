
const winston = require('winston');
export const debugLogger = require('debug');

export const info = (...vars) => console.log('info', ...vars);
export const debug = (...vars) => console.log('debug', ...vars);
export const error = (...vars) => console.log('error', ...vars);