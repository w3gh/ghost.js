const crypto = require('crypto');

export class SHA1 {
    protected _hash;

    constructor() {
        this.reset();
    }

    update(str: any) {
        this._hash.update(str);
    }

    digest() {
        return Buffer.from(this._hash.digest('hex'), "hex")
    }

    reset() {
        this._hash = crypto.createHash('sha1')
    }
}
