// libbncsutil
import path from 'path';
import ref from 'ref';
import bp from 'bufferpack';

import lib from './libbncsutil';

class BNCSUtil {
	static PLATFORM_X86 = 1;
	static PLATFORM_WINDOWS = 1;
	static PLATFORM_WIN = 1;
	static PLATFORM_MAC = 2;
	static PLATFORM_PPC = 2;
	static PLATFORM_OSX = 3;

	constructor() {
		this._lib = lib.libbncsutil;

		// ffi.Library('libbncsutil', {
		// 	// NLS: [],
		// 	// getPublicKey: []
		// 	//nls_init: ['int', ['char', 'char']],
		// 	bncsutil_getVersion: ['ulong', []],
		// 	bncsutil_getVersionString: ['int', ['string']],
		// 	extractMPQNumber: ['int', ['char']],
		// 	getExeInfo: ['int', ['string', 'char*', 'size_t', 'uint', 'int']]
		// 	//MEXP(int) getExeInfo(const char* file_name, char* exe_info, size_t exe_info_size, uint32_t* version, int platform)
		// });
	}

	extractMPQNumber(mpqName) {
		return this._lib.extractMPQNumber(mpqName);
	}

	getVersion() {
		var verChar = ref.alloc('string');

		this._lib.bncsutil_getVersionString(verChar);

		var version = bp.unpack('<S', verChar);

		return version.join('')
	}

	hasPassword(password) {
		var char = ref.alloc(ref.types.CString);
		var charRef = ref.ref(char);

		this._lib.hashPassword(password, char);

		console.log('pass', char)
	}

	getExeInfo(fileName, platform) {
		var exeInfo = ref.alloc('string');
		var exeInfoRef = ref.ref(exeInfo);
		var version = ref.alloc('ulong');
		var versionRef = ref.ref(ref.alloc(lib.uint32_t));

		//MEXP(int) getExeInfo(const char* file_name, char* exe_info, size_t exe_info_size, uint32_t* version, int platform)

		var exeBytes = this._lib.getExeInfo(
			fileName,
			exeInfoRef,
			exeInfo.length,
			versionRef,
			platform
		);

		return {
			exeBytes: exeBytes,
			info: ref.deref(exeInfoRef),
			version: ref.deref(versionRef),
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
	checkRevisionFlat(valueString, file1, file2, file3, mpqNumber, checksum) {
		return this._lib.checkRevisionFlat(
			valueString,
			file1,
			file2,
			file3,
			mpqNumber,
			checksum
		);
	}

	init(force = false) {

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
	 * @returns {publicValue, product, hashBuffer}
	 */
	kd_quick(CDKey, clientToken, serverToken) {
		var publicValue = ref.alloc('uint32');
		var publicValueRef = ref.ref(publicValue);
		var product = ref.alloc('uint32');
		var productRef = ref.ref(product);
		var hashBuffer = ref.alloc('string');
		var hashBufferRef = ref.ref(hashBuffer);

		this._lib.kd_quick(
			CDKey,
			clientToken,
			serverToken,
			publicValueRef,
			productRef,
			hashBufferRef,
			hashBuffer.length
		);

    // init()
    // global _libbncsutil, _utilthread
    // public_value = c_uint()
    // product = c_uint()
    // hash_buffer = create_string_buffer(256)
    // _utilthread.execute(_libbncsutil.kd_quick, cd_key, client_token, server_token, byref(public_value), byref(product), byref(hash_buffer), 256)
    // return CdKey(public_value.value, product, hash_buffer.value)
        return {publicValue, product, hashBuffer};
	}

	HELP_SID_AUTH_CHECK(TFT, war3Path, CDKeyROC, CDKeyTFT, formula, IX86VerFileName, clientToken, serverToken) {


	}

	HELP_SID_AUTH_ACCOUNTLOGON() {

	}
}

export default BNCSUtil;

// const bncs = new BNCSUtil();
// const war3ExePath = path.resolve('./war3.exe');
// const version = bncs.getVersion();
// const info = bncs.getExeInfo(war3ExePath, BNCSUtil.PLATFORM_X86);
// const pass = bncs.hasPassword('adasdsad');

// console.log(war3ExePath);
// console.log(version);
// console.log(info);
//console.log(bp.unpack('<I', info.version));