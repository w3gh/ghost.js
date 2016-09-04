// libbncsutil
import ref from 'ref';
import bp from 'bufferpack';
import os from 'os';

import lib from './libbncsutil';

class BNCSUtil {
	static PLATFORM_X86 = 1;
	static PLATFORM_WINDOWS = 1;
	static PLATFORM_WIN = 1;
	static PLATFORM_MAC = 2;
	static PLATFORM_PPC = 2;
	static PLATFORM_OSX = 3;

	static extractMPQNumber(mpqName) {
		return lib.libbncsutil.extractMPQNumber(mpqName);
	}

	static getPlatform() {
		switch (os.platform()) {
			case 'darwin':
				return BNCSUtil.PLATFORM_MAC;

			case 'aix':
			case 'freebsd':
			case 'linux':
			case 'openbsd':
			case 'sunos':
			case 'win32':
				return BNCSUtil.PLATFORM_X86;
		}
	}

	static getVersion() {
		var verChar = ref.alloc('string');

		lib.libbncsutil.bncsutil_getVersionString(verChar);

		var version = bp.unpack('<S', verChar);

		return version.join('')
	}

	static hasPassword(password) {
		var char = ref.alloc(ref.types.CString);
		var charRef = ref.ref(char);

		lib.libbncsutil.hashPassword(password, char);

		console.log('pass', char)
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
	static getExeInfo(fileName, platform) {
		var exeInfo = Buffer.alloc(256); //ref.alloc('string');
			exeInfo.type = ref.types.CString;
		var exeVersion = ref.alloc('uint32'); //ref.alloc(lib.uint32_t);

		//MEXP(int) getExeInfo(const char* file_name, char* exe_info, size_t exe_info_size, uint32_t* version, int platform)

		var length = lib.libbncsutil.getExeInfo(
			fileName,
			exeInfo,
			exeInfo.length,
			exeVersion,
			platform
		);

		return {
			length,
			exeInfo: exeInfo.slice(0, length).toString(),
			exeVersion: exeVersion.toString()
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
	static checkRevisionFlat(valueString, file1, file2, file3, mpqNumber) {
		var checksum = ref.alloc(ref.types.ulong);

		lib.libbncsutil.checkRevisionFlat(
			valueString,
			file1,
			file2,
			file3,
			mpqNumber,
			checksum
		);

		console.log('checksum', checksum);

		return checksum.toString();
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
	static kd_quick(CDKey, clientToken, serverToken) {
		var publicValue = ref.alloc('uint32');
		var publicValueRef = ref.ref(publicValue);
		var product = ref.alloc('uint32');
		var productRef = ref.ref(product);
		var hashBuffer = ref.alloc('string');
		var hashBufferRef = ref.ref(hashBuffer);

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

	HELP_SID_AUTH_CHECK(TFT, war3Path, CDKeyROC, CDKeyTFT, formula, IX86VerFileName, clientToken, serverToken) {


	}

	HELP_SID_AUTH_ACCOUNTLOGON() {

	}
}

export default BNCSUtil;