// libbncsutil
import * as ref from 'ref-napi';
import * as bp from 'bufferpack';
import * as os from 'os';

import * as lib from './libbncsutil/libbncsutil';
import {ByteArray} from './Bytes';
import {createLoggerFor} from "./Logger";

const {debug, info, error} = createLoggerFor('BNCSUtil');

export interface BNCSExeInfo {
    length: number,
    exeInfo: Buffer,
    exeVersion: Buffer
}

export interface BNCSCdKey {
    publicValue: string,
    product: string,
    hash: string
}

export class BNCSUtil {
    static PLATFORM_X86 = 1;
    static PLATFORM_WINDOWS = 1;
    static PLATFORM_WIN = 1;
    static PLATFORM_MAC = 2;
    static PLATFORM_PPC = 2;
    static PLATFORM_OSX = 3;

    static extractMPQNumber(mpqName): string {
        return lib.libbncsutil.extractMPQNumber(mpqName);
    }

    static getPlatform(): number {
        switch (os.platform()) {
            case 'darwin':
                return BNCSUtil.PLATFORM_X86;
            //return BNCSUtil.PLATFORM_MAC; cuz getExeInfo method is buggy if platform MAC

            case 'aix':
            case 'freebsd':
            case 'linux':
            case 'openbsd':
            case 'sunos':
            case 'win32':
                return BNCSUtil.PLATFORM_X86;
        }
    }

    static getVersion(): string {
        let verChar = ref.alloc('string');

        lib.libbncsutil.bncsutil_getVersionString(verChar);

        return verChar.toString();
    }

    /**
     * Retrieves version and date/size information from executable file.
     * Returns 0 on failure or length of exeInfoString.
     * If the generated string is longer than the buffer, the needed buffer
     * length will be returned, but the string will not be copied into
     * exeInfoString.  Applications should check to see if the return value
     * is greater than the length of the buffer, and increase its size if
     * necessary.
     */
    static getExeInfo(fileName, platform): BNCSExeInfo {
        let exeInfo = Buffer.alloc(1024); //ref.alloc('string');
        let exeVersion = Buffer.alloc(4); //ref.alloc(lib.uint32_t);

        //MEXP(int) getExeInfo(const char* file_name, char* exe_info, size_t exe_info_size, uint32_t* version, int platform)

        let length = lib.libbncsutil.getExeInfo(
            fileName,
            exeInfo,
            exeInfo.length,
            exeVersion,
            platform
        );

        return {
            length,
            exeInfo,
            exeVersion
        }
    }

    /**
     * Alternate form of CheckRevision function.
     * Really only useful for VB programmers;
     * VB seems to have trouble passing an array
     * of strings to a DLL function
     * MEXP(int) checkRevisionFlat(
     const char* valueString,
     const char* file1,
     const char* file2,
     const char* file3,
     int mpqNumber,
     unsigned long* checksum
     )
     */
    static checkRevisionFlat(valueString, file1, file2, file3, mpqNumber): Buffer {
        let checksum = ref.alloc('uint32');

        //console.log('checkRevisionFlat', arguments);

        lib.libbncsutil.checkRevisionFlat(
            valueString,
            file1,
            file2,
            file3,
            mpqNumber,
            checksum
        );

        return checksum;
    }

    /**
     * MEXP(int) kd_quick(const char* cd_key, uint32_t client_token,
     uint32_t server_token, uint32_t* public_value,
     uint32_t* product, char* hash_buffer, size_t buffer_len)

     : [ref.types.int32, [
     ref.types.CString,
     ref.types.uint32,
     ref.types.uint32,
     uint32_tPtr,
     uint32_tPtr,
     ref.types.CString,
     ref.types.ulong,
     ]],
     * @returns BNCSCdKey
     */
    static kd_quick(CDKey: string, clientToken: string, serverToken: string): BNCSCdKey {
        let publicValue = ref.alloc('uint32');
        let product = ref.alloc('uint32');
        let hashBuffer = ref.alloc('string');

        lib.libbncsutil.kd_quick(
            CDKey,
            clientToken,
            serverToken,
            publicValue,
            product,
            hashBuffer,
            hashBuffer.length
        );

        // init()
        // global _libbncsutil, _utilthread
        // public_value = c_uint()
        // product = c_uint()
        // hash_buffer = create_string_buffer(256)
        // _utilthread.execute(_libbncsutil.kd_quick, cd_key, client_token, server_token, byref(public_value), byref(product), byref(hash_buffer), 256)
        // return CdKey(public_value.value, product, hash_buffer.value)
        return {
            publicValue: publicValue.toString('hex'),
            product: product.toString('hex'),
            hash: hashBuffer.toString('hex')
        };
    }

    /*

     */
    static nls_init(username, password): Buffer {
        /**
         * MEXP(nls_t*) nls_init_l(const char* username, unsigned long username_length,
         const char* password, unsigned long password_length)
         */
        return lib.libbncsutil.nls_init_l(username, username.length, password, password.length)
    }

    /**
     * Gets the public key (A). (32 bytes)
     */
    static nls_get_A(nls_t): Buffer {
        let buffer = Buffer.alloc(32);

        lib.libbncsutil.nls_get_A(nls_t, buffer);

        return buffer;
    }

    /**
     * Gets the "M[1]" value, which proves that you know your password.
     * The buffer "out" must be at least 20 bytes long.
     */
    static nls_get_M1(nls_t, B, salt): Buffer {
        //MEXP(void) nls_get_M1(nls_t* nls, char* out, const char* B, const char* salt);
        let buffer = Buffer.alloc(20);

        lib.libbncsutil.nls_get_M1(nls_t, buffer, B, salt);

        return buffer;
    }

    /**
     * Single-hashes the password for account creation and password changes.
     */
    static hashPassword(password): Buffer {
        let buffer = Buffer.alloc(20);

        lib.libbncsutil.hashPassword(password, buffer);

        return buffer
    }

    static createKeyInfo(key, clientToken, serverToken): Buffer {
        let kd = BNCSUtil.kd_quick(key, clientToken, serverToken);
        let bytes = [
            bp.pack('<I', key.length),
            bp.pack('<I', kd.product),
            bp.pack('<I', kd.publicValue),
            '\x00\x00\x00\x00',
            kd.hash
        ];
        const buff = ByteArray(bytes);

        info('createKeyInfo', buff.toString('hex'));

        return buff;
    }

    static createClientPublicKey(username, password) {
        let nls = BNCSUtil.nls_init(username, password);

        const buff = BNCSUtil.nls_get_A(nls);

        info('createClientPublicKey', buff.toString('hex'));

        return buff
    }
}
