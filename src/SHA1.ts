import {ArrayToString, StringToUint8} from "./Bytes";

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
    protected m_state = new Uint32Array(5);

    protected m_count = new Uint32Array(2);

    protected m_buffer = new Uint8Array(64);

    protected m_digest = new Uint8Array(20);

    constructor() {
        this.reset()
    }

    reset() {
        // SHA1 initialization constants
        this.m_state[0] = 0x67452301;
        this.m_state[1] = 0xEFCDAB89;
        this.m_state[2] = 0x98BADCFE;
        this.m_state[3] = 0x10325476;
        this.m_state[4] = 0xC3D2E1F0;

        this.m_count[0] = 0;
        this.m_count[1] = 0;

        block = null;
    }

    update(str: string) {
        let /*uint32_t*/ i = 0, j = 0;

        let data = StringToUint8(str);
        let len = str.length;

        j = (this.m_count[0] >> 3) & 63;

        if ((this.m_count[0] += len << 3) < (len << 3)) this.m_count[1]++;

        this.m_count[1] += (len >> 29);

        if ((j + len) > 63) {
            // memcpy(&this.m_buffer[j], data, (i = 64 - j));
            this.transform(this.m_state, this.m_buffer);

            for (; i + 63 < len; i += 64) {
                this.transform(this.m_state, data[i]);
            }

            j = 0;
        }
        else i = 0;

        // memcpy(&m_buffer[j], &data[i], len - i);
    }

    final() {
        let i = 0, j = 0; // uint32_t
        // unsigned char finalcount[8] = { 0, 0, 0, 0, 0, 0, 0, 0 };
        let finalcount = new Uint8Array(8);

        for (i = 0; i < 8; ++i)
            finalcount[i] = ((this.m_count[(i >= 4 ? 0 : 1)] >> ((3 - (i & 3)) * 8) ) & 255); // Endian independent

        this.update("\200");

        while ((this.m_count[0] & 504) != 448)
            this.update("\0");

        this.update(ArrayToString(finalcount)); // Cause a SHA1Transform()

        for (i = 0; i < 20; ++i) {
            this.m_digest[i] = ((this.m_state[i >> 2] >> ((3 - (i & 3)) * 8) ) & 255);
        }

        // Wipe variables for security reasons
        i = 0;
        j = 0;

        // memset(m_state, 0, 20);
        this.m_state = new Uint32Array(5);

        // memset(m_count, 0, 8);
        this.m_count = new Uint32Array(2);

        // memset(m_buffer, 0, 64);
        this.m_buffer = new Uint8Array(64);

        // memset(finalcount, 0, 8);
        finalcount = new Uint8Array(8);

        this.transform(this.m_state, this.m_buffer);
    }

    getHash() {}

    protected transform(state: Uint32Array, buffer: Uint8Array) {
        let a = 0, b = 0, c = 0, d = 0, e = 0;

        block = buffer;
        block.l = buffer.length;

        // Copy state[] to working vars
        a = state[0];
        b = state[1];
        c = state[2];
        d = state[3];
        e = state[4];

        // 4 rounds of 20 operations each. Loop unrolled.
        R0(a,b,c,d,e, 0); R0(e,a,b,c,d, 1); R0(d,e,a,b,c, 2); R0(c,d,e,a,b, 3);
        R0(b,c,d,e,a, 4); R0(a,b,c,d,e, 5); R0(e,a,b,c,d, 6); R0(d,e,a,b,c, 7);
        R0(c,d,e,a,b, 8); R0(b,c,d,e,a, 9); R0(a,b,c,d,e,10); R0(e,a,b,c,d,11);
        R0(d,e,a,b,c,12); R0(c,d,e,a,b,13); R0(b,c,d,e,a,14); R0(a,b,c,d,e,15);
        R1(e,a,b,c,d,16); R1(d,e,a,b,c,17); R1(c,d,e,a,b,18); R1(b,c,d,e,a,19);
        R2(a,b,c,d,e,20); R2(e,a,b,c,d,21); R2(d,e,a,b,c,22); R2(c,d,e,a,b,23);
        R2(b,c,d,e,a,24); R2(a,b,c,d,e,25); R2(e,a,b,c,d,26); R2(d,e,a,b,c,27);
        R2(c,d,e,a,b,28); R2(b,c,d,e,a,29); R2(a,b,c,d,e,30); R2(e,a,b,c,d,31);
        R2(d,e,a,b,c,32); R2(c,d,e,a,b,33); R2(b,c,d,e,a,34); R2(a,b,c,d,e,35);
        R2(e,a,b,c,d,36); R2(d,e,a,b,c,37); R2(c,d,e,a,b,38); R2(b,c,d,e,a,39);
        R3(a,b,c,d,e,40); R3(e,a,b,c,d,41); R3(d,e,a,b,c,42); R3(c,d,e,a,b,43);
        R3(b,c,d,e,a,44); R3(a,b,c,d,e,45); R3(e,a,b,c,d,46); R3(d,e,a,b,c,47);
        R3(c,d,e,a,b,48); R3(b,c,d,e,a,49); R3(a,b,c,d,e,50); R3(e,a,b,c,d,51);
        R3(d,e,a,b,c,52); R3(c,d,e,a,b,53); R3(b,c,d,e,a,54); R3(a,b,c,d,e,55);
        R3(e,a,b,c,d,56); R3(d,e,a,b,c,57); R3(c,d,e,a,b,58); R3(b,c,d,e,a,59);
        R4(a,b,c,d,e,60); R4(e,a,b,c,d,61); R4(d,e,a,b,c,62); R4(c,d,e,a,b,63);
        R4(b,c,d,e,a,64); R4(a,b,c,d,e,65); R4(e,a,b,c,d,66); R4(d,e,a,b,c,67);
        R4(c,d,e,a,b,68); R4(b,c,d,e,a,69); R4(a,b,c,d,e,70); R4(e,a,b,c,d,71);
        R4(d,e,a,b,c,72); R4(c,d,e,a,b,73); R4(b,c,d,e,a,74); R4(a,b,c,d,e,75);
        R4(e,a,b,c,d,76); R4(d,e,a,b,c,77); R4(c,d,e,a,b,78); R4(b,c,d,e,a,79);

        // Add the working vars back into state[]
        state[0] += a;
        state[1] += b;
        state[2] += c;
        state[3] += d;
        state[4] += e;

        // Wipe variables
        a = 0;
        b = 0;
        c = 0;
        d = 0;
        e = 0;
    }
}