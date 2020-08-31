import * as fs from 'fs';
import * as path from 'path';

const startTime = Date.now();

export function getTime() {
    return Math.floor(Date.now() / 1000);
}

export function getTicks() {
    return Date.now() - startTime;
}

export function getTimezone() {
    return Math.abs(new Date(Date.now()).getTimezoneOffset());
}

export function networkInterfaces() {
    const os = require('os');
    const ifaces = os.networkInterfaces();
    const faces = [];

    Object.keys(ifaces).forEach(function (ifname) {
        let alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                faces.push({name: ifname + ':' + alias, address: iface.address});
                // this single interface has multiple ipv4 addresses
            } else {
                // this interface has only one ipv4 adress
                faces.push({name: ifname, address: iface.address});
            }
            ++alias;
        });
    });

    return faces;
}

export function localIP() {
    return require('ip').address();
}

export function ipToBuffer(ip:string) {
    return require('ip').toBuffer(ip);
}

export function isNameValid(name) {
    return name.length && name.length <= 15
}

export function resolveLibraryPath(name: string) {
    const platform = process.platform;
    const cwd = process.cwd();
    let libPath = null;

    if (platform === 'win32') {
        libPath = `${name}.dll`;
    } else if (platform === 'linux') {
        libPath = `lib${name}.so`;
    } else if (platform === 'darwin') {
        libPath = `lib${name}.dylib`;
    } else {
        throw new Error(`unsupported plateform for ${name}`);
    }

    let libName = path.resolve(cwd, libPath);

    if (!fs.existsSync(libName)) {
        console.error(`${libName} not found, fallback to libstorm`);

        return `lib${name}`;
    }

    return libName;
}
