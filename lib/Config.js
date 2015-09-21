'use strict';

export default class Config {
	getItem(name, defaultValue) {
		return name || defaultValue;
	}
}
