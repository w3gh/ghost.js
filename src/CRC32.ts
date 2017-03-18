
/*
#include "crc32.h"

void CCRC32 :: Initialize( )
{
        for( int iCodes = 0; iCodes <= 0xFF; ++iCodes )
	{
		ulTable[iCodes] = Reflect( iCodes, 8 ) << 24;

		for( int iPos = 0; iPos < 8; iPos++ )
			ulTable[iCodes] = ( ulTable[iCodes] << 1 ) ^ ( ulTable[iCodes] & (1 << 31) ? CRC32_POLYNOMIAL : 0 );

		ulTable[iCodes] = Reflect( ulTable[iCodes], 32 );
	}
}

uint32_t CCRC32 :: Reflect( uint32_t ulReflect, char cChar )
{
	uint32_t ulValue = 0;

        for( int iPos = 1; iPos < ( cChar + 1 ); ++iPos )
	{
		if( ulReflect & 1 )
			ulValue |= 1 << ( cChar - iPos );

		ulReflect >>= 1;
	}

	return ulValue;
}

uint32_t CCRC32 :: FullCRC( unsigned char *sData, uint32_t ulLength )
{
	uint32_t ulCRC = 0xFFFFFFFF;
	PartialCRC( &ulCRC, sData, ulLength );
	return ulCRC ^ 0xFFFFFFFF;
}

void CCRC32 :: PartialCRC( uint32_t *ulInCRC, unsigned char *sData, uint32_t ulLength )
{
	while( ulLength-- )
		*ulInCRC = ( *ulInCRC >> 8 ) ^ ulTable[( *ulInCRC & 0xFF ) ^ *sData++];
}
*/

export class CRC32 {

    ulTable = new Uint32Array(256);

    CRC32_POLYNOMIAL = 0x04c11db7;

    constructor() {
        this.init();
    }

    init() {
        let ulTable = this.ulTable;

        for (let iCodes = 0; iCodes <= 0xFF; ++iCodes) {
            ulTable[iCodes] = this.reflect(iCodes, 8) << 24;

            for (let iPos = 0; iPos < 8; iPos++)
                ulTable[iCodes] = ( ulTable[iCodes] << 1 ) ^ ( ulTable[iCodes] & (1 << 31) ? this.CRC32_POLYNOMIAL : 0 );

            ulTable[iCodes] = this.reflect(ulTable[iCodes], 32);
        }
    }

    reflect(ulReflect: number, cChar: number) {
        let ulValue = 0;

        for (let iPos = 1; iPos < ( cChar + 1 ); ++iPos) {
            if (ulReflect & 1)
                ulValue |= 1 << ( cChar - iPos );

            ulReflect >>= 1;
        }

        return ulValue;
    }

    fullCRC(sData, ulLength: number) {
        let ulCRC = 0xFFFFFFFF;

        ulCRC = this.partialCRC(ulCRC, sData, ulLength);

        return ulCRC ^ 0xFFFFFFFF;
    }

    partialCRC(ulInCRC: number, sData, ulLength) {
        let ulTable = this.ulTable;

        while (ulLength--)
            ulInCRC = ( ulInCRC >> 8 ) ^ ulTable[( ulInCRC & 0xFF ) ^ sData++];

        return ulInCRC
    }
}