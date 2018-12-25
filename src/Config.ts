import * as fs from 'fs';

export class Config {
    data: Object = null;

    constructor(configPath: string|Object) {
        if (!configPath) return null;

        if (typeof configPath === 'string') {
            const file = fs.readFileSync(configPath, 'utf-8');
            this.data = JSON.parse(file);
        } else {
            this.data = Object.assign({}, configPath);
        }
    }

    /**
     * Slices part of config into separate class
     * @param name
     * @returns {Config}
     */
    slice(name: string): Config {
        const value = this.item(name, null);

        return value !== null ? new Config(value) : value;
    }

    /**
     * returns item from config
     * @param {String} name
     * @param {*} fallback
     * @returns {*}
     */
    item<T>(name: string, fallback: T = null): T {
        let curr = this.data,
            names = name.split('.');

        if (curr === null) return fallback;

        for (let n of names) {
            curr = curr[n];

            if (typeof curr === 'undefined') return fallback;
        }

        return typeof curr !== 'undefined' ? curr as T : fallback;
    }
}
