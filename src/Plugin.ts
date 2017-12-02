import {Config} from './Config';
import {resolve} from 'path';
import {create} from './Logger';

const {debug, info, error} = create('Plugin');

interface LoadedPlugins {
    [name: string]: Plugin;
}

export interface PluginInterface {
    config: any;

    new(config: any): PluginInterface
}

export interface PluginDefinition {

}

export class Plugin {
    static loaded: LoadedPlugins = {};

    constructor(protected config: any) {
    }

    static load(name, config: Config) {
        if (!name) return;

        const requirePath = resolve(`${__dirname}/../plugins/${name}`);
        let ExportedClass;

        try {
            ExportedClass = require(requirePath)(Plugin);
        } catch (e) {
            error(`failed to load plugin '${name}' by path '${requirePath}'`);
            error(e);
            return;
        }

        if (typeof ExportedClass !== 'function') {
            error(`plugin '${name}' must export class or function`);
            return;
        }

        try {
            let instance = new ExportedClass(config);

            if (instance instanceof Plugin) {
                info(`load "${instance.constructor.name}"`);

                Plugin.loaded[name] = instance;
            } else {
                error(`plugin '${name}' must be an instance of class "Plugin"`);
                instance = null;
            }
        } catch (e) {
            error(`${name}: `, e);
            return;
        }
    }

    static emit(eventName: string, data: any) {
        Object.keys(Plugin.loaded).forEach((plugName) => {
            let instance = Plugin.loaded[plugName];

            if (typeof instance[eventName] === 'function') {
                instance[eventName](data);
                debug(`emit ${eventName}`);
            }
        })
    }
}
