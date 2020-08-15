// libbncsutil
import ref from 'ref-napi';
import bp from 'bufferpack';
import os from 'os';

import lib from './libStorm';


class Storm {
	static MPQ_FORMAT_VERSION_1 = 0;       // Up to The Burning Crusade
	static MPQ_FORMAT_VERSION_2 = 1;       // The Burning Crusade and newer

	// Flags for SFileOpenArchiveEx
	static MPQ_OPEN_NO_LISTFILE = 0x00000001;  // Don't add the internal listfile
	static MPQ_OPEN_NO_ATTRIBUTES = 0x00000002;  // Don't open the attributes
	static MPQ_OPEN_FORCE_MPQ_V1 = 0x00000004;  // Always open the archive as MPQ v 1.00, ignore the "wFormatVersion" variable in the header

	// Flags for MPQ attributes
	static MPQ_ATTRIBUTE_CRC32 = 0x00000001;  // The "(attributes)" contain array of CRC32s
	static MPQ_ATTRIBUTE_FILETIME = 0x00000002;  // The "(attributes)" contain array of FILETIMEs
	static MPQ_ATTRIBUTE_MD5 = 0x00000004;  // The "(attributes)" contain array of MD5s

	// Supports archives with size > 4 GB
	// Additional flags for SFileCreateArchiveEx
	static MPQ_CREATE_ARCHIVE_V1 = 0x00000000; // Creates archive with size up to 4GB
	static MPQ_CREATE_ARCHIVE_V2 = 0x00010000;  // Creates archive larger than 4 GB
	static MPQ_CREATE_ATTRIBUTES = 0x00100000;  // Also add the (attributes) file

	// Formats of (attributes) file
	static MPQ_ATTRIBUTES_V1 = 100;         // FOrmat version 1.00

	//const TCHAR * szMpqName, DWORD dwPriority, DWORD dwFlags, HANDLE * phMpq
	static SFileOpenArchive(szMpqName, dwPriority, dwFlags) {
		var type = ref.refType(ref.types.void);
		var handle = ref.alloc('void');
		//var flags = Buffer.from()
		console.log('handle', handle);
		const status = lib.Storm.SFileOpenArchive(
			szMpqName,
			dwPriority,
			dwFlags,
			handle
		);

		console.log('SFileOpenArchive', status);

	}

	//SFileCreateArchive(const TCHAR * szMpqName, DWORD dwCreateFlags, DWORD dwMaxFileCount, HANDLE * phMpq);
	SFileOpenFileEx(szMpqName, dwCreateFlags, dwMaxFileCount, phMpq) {
	}

	SFileReadFile() {
	}

	SFileCloseFile() {
	}
}


export default Storm;
