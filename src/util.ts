
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
