import bunyan from 'bunyan';
import winston from 'winston';

//const log = bunyan.createLogger({name: 'W3GS'});

export default (...args) => {
	winston.log('info', ...args);
};