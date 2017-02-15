// libbncsutil
import ref from 'ref';
import bp from 'bufferpack';
import os from 'os';
import fs from 'fs';
import path from 'path';

import lib from '../libbncsutil/libbncsutil';
import {ByteArray} from './Bytes';

class BNCSUtil {
	static PLATFORM_X86 = 1;
	static PLATFORM_WINDOWS = 1;
	static PLATFORM_WIN = 1;
	static PLATFORM_MAC = 2;
	static PLATFORM_PPC = 2;
	static PLATFORM_OSX = 3;

	constructor() {

	}

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
			exeInfo: exeInfo.slice(0, length),
			exeVersion: exeVersion
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
		var checksum = ref.alloc('uint32');

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
	 * @returns {publicValue, product, hashBuffer}
	 */
	static kd_quick(CDKey, clientToken, serverToken) {
		var publicValue = ref.alloc('uint32');
		var product = ref.alloc('uint32');
		var hashBuffer = ref.alloc('string');

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
	static nls_init(username, password) {
		/**
		 * MEXP(nls_t*) nls_init_l(const char* username, unsigned long username_length,
		 const char* password, unsigned long password_length)
		 */
		return lib.libbncsutil.nls_init_l(username, username.length, password, password.length)
	}

	/**
	 * Gets the public key (A). (32 bytes)
	 */
	static nls_get_A(nls_t) {
		var buffer = Buffer.alloc(32);

		lib.libbncsutil.nls_get_A(nls_t, buffer);

		return buffer;
	}

	/**
	 * Gets the "M[1]" value, which proves that you know your password.
	 * The buffer "out" must be at least 20 bytes long.
	 */
	static nls_get_M1(nls_t, B, salt) {
		//MEXP(void) nls_get_M1(nls_t* nls, char* out, const char* B, const char* salt);
		var buffer = Buffer.alloc(20);

		lib.libbncsutil.nls_get_M1(nls_t, buffer, B, salt);

		return buffer;
	}

	/**
	 * Single-hashes the password for account creation and password changes.
	 */
	static hashPassword(password) {
		var buffer = Buffer.alloc(20);

		lib.libbncsutil.hashPassword(password, buffer);

		return buffer
	}

	static  createKeyInfo(key, clientToken, serverToken) {
		var info = BNCSUtil.kd_quick(key, clientToken, serverToken);
		var bytes = [
			bp.pack('<I', key.length),
			bp.pack('<I', info.product),
			bp.pack('<I', info.publicValue),
			'\x00\x00\x00\x00',
			info.hash
		];

		return ByteArray(bytes);
	}

	static HELP_SID_AUTH_CHECK(TFT, war3Path, keyROC, keyTFT, formula, IX86VerFileName, clientToken, serverToken) {
// set m_EXEVersion, m_EXEVersionHash, m_EXEInfo, m_InfoROC, m_InfoTFT

		const war3EXEPath = path.join(war3Path, 'war3.exe');
		const stormDLLPath = path.join(war3Path, 'storm.dll');
		const gameDLLPath = path.join(war3Path, 'game.dll');

		const war3EXEExist = fs.existsSync(war3EXEPath);
		const stormDLLExist = fs.existsSync(stormDLLPath);
		const gameDLLExist = fs.existsSync(gameDLLPath);

		if (war3EXEExist && stormDLLExist && gameDLLExist) {

			const exe = BNCSUtil.getExeInfo(war3EXEPath, BNCSUtil.getPlatform());

			let {exeInfo, exeVersion} = exe;

			exeVersion = bp.pack('<I', exeVersion);

			let exeVersionHash = BNCSUtil.checkRevisionFlat(
				formula,
				this.war3exePath,
				this.stormdllPath,
				this.gamedllPath,
				BNCSUtil.extractMPQNumber(IX86VerFileName)
			);

			let keyInfoROC = BNCSUtil.createKeyInfo(
				keyROC,
				bp.unpack('<I', clientToken)[0],
				bp.unpack('<I', serverToken)[0]
			);

			let keyInfoTFT = '';

			if (TFT) {
				keyInfoTFT = BNCSUtil.createKeyInfo(
					keyTFT,
					bp.unpack('<I', clientToken)[0],
					bp.unpack('<I', serverToken)[0]
				);

				info('attempting to auth as Warcraft III: The Frozen Throne');
			} else {
				info('attempting to auth as Warcraft III: Reign of Chaos');
			}
		}

//
// 	string FileWar3EXE = war3Path + "war3.exe";
// 	string FileStormDLL = war3Path + "Storm.dll";
//
// 	if( !UTIL_FileExists( FileStormDLL ) )
// 		FileStormDLL = war3Path + "storm.dll";
//
// 	string FileGameDLL = war3Path + "game.dll";
// 	bool ExistsWar3EXE = UTIL_FileExists( FileWar3EXE );
// 	bool ExistsStormDLL = UTIL_FileExists( FileStormDLL );
// 	bool ExistsGameDLL = UTIL_FileExists( FileGameDLL );
//
// 	if( ExistsWar3EXE && ExistsStormDLL && ExistsGameDLL )
// 	{
// 		// todotodo: check getExeInfo return value to ensure 1024 bytes was enough
//
// 		char buf[1024];
// 		uint32_t EXEVersion;
// 		getExeInfo( FileWar3EXE.c_str( ), (char *)&buf, 1024, (uint32_t *)&EXEVersion, BNCSUTIL_PLATFORM_X86 );
// 		m_EXEInfo = buf;
// 		m_EXEVersion = UTIL_CreateByteArray( EXEVersion, false );
// 		unsigned long EXEVersionHash;
// 		checkRevisionFlat( valueStringFormula.c_str( ), FileWar3EXE.c_str( ), FileStormDLL.c_str( ), FileGameDLL.c_str( ), extractMPQNumber( mpqFileName.c_str( ) ), (unsigned long *)&EXEVersionHash );
// 		m_EXEVersionHash = UTIL_CreateByteArray( (uint32_t) EXEVersionHash, false );
// 		m_KeyInfoROC = CreateKeyInfo( keyROC, UTIL_ByteArrayToUInt32( clientToken, false ), UTIL_ByteArrayToUInt32( serverToken, false ) );
//
// 		if( TFT )
// 			m_KeyInfoTFT = CreateKeyInfo( keyTFT, UTIL_ByteArrayToUInt32( clientToken, false ), UTIL_ByteArrayToUInt32( serverToken, false ) );
//
// 		if( m_KeyInfoROC.size( ) == 36 && ( !TFT || m_KeyInfoTFT.size( ) == 36 ) )
// 			return true;
// 		else
// 		{
// 			if( m_KeyInfoROC.size( ) != 36 )
// 				CONSOLE_Print( "[BNCSUI] unable to create ROC key info - invalid ROC key" );
//
// 			if( TFT && m_KeyInfoTFT.size( ) != 36 )
// 				CONSOLE_Print( "[BNCSUI] unable to create TFT key info - invalid TFT key" );
// 		}
// 	}
// 	else
// 	{
// 		if( !ExistsWar3EXE )
// 			CONSOLE_Print( "[BNCSUI] unable to open [" + FileWar3EXE + "]" );
//
// 		if( !ExistsStormDLL )
// 			CONSOLE_Print( "[BNCSUI] unable to open [" + FileStormDLL + "]" );
//
// 		if( !ExistsGameDLL )
// 			CONSOLE_Print( "[BNCSUI] unable to open [" + FileGameDLL + "]" );
// 	}
//
// 	return false;

	}

	HELP_SID_AUTH_ACCOUNTLOGON() {

	}
}

export default BNCSUtil;