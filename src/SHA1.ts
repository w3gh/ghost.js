const crypto = require('crypto');

let block;

const ROL32 = (value, bits) => (((value) << (bits)) | ((value) >> (32 - (bits))));
const SHABLK0 = (i) => (block.l[i] = (ROL32(block.l[i], 24) & 0xFF00FF00) | (ROL32(block.l[i], 8) & 0x00FF00FF));
const R0 = (v,w,x,y,z,i) => { z+=((w&(x^y))^y)+SHABLK0(i)+0x5A827999+ROL32(v,5); w=ROL32(w,30); };
const R1 = (v,w,x,y,z,i) => { z+=((w&(x^y))^y)+SHABLK(i)+0x5A827999+ROL32(v,5); w=ROL32(w,30); };
const R2 = (v,w,x,y,z,i) => { z+=(w^x^y)+SHABLK(i)+0x6ED9EBA1+ROL32(v,5); w=ROL32(w,30); };
const R3 = (v,w,x,y,z,i) => { z+=(((w|x)&y)|(w&x))+SHABLK(i)+0x8F1BBCDC+ROL32(v,5); w=ROL32(w,30); };
const R4 = (v,w,x,y,z,i) => { z+=(w^x^y)+SHABLK(i)+0xCA62C1D6+ROL32(v,5); w=ROL32(w,30); }

const SHABLK = (i) => (block.l[i&15] = ROL32(block.l[(i+13)&15] ^ block.l[(i+8)&15] ^ block.l[(i+2)&15] ^ block.l[i&15],1));

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