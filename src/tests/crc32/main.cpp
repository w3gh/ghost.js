#include "includes.h"
#include "crc32.h"
#include "util.h"

class CCRC32;

int main(int argc, char *argv[])
{
    if (argc > 1) {
        CCRC32 *m_CRC = new CCRC32( );
        m_CRC->Initialize( );
        string m_MapData = UTIL_FileRead(argv[1]);

        if (!m_MapData.empty()) {
            uint32_t crc = (uint32_t)m_CRC->FullCRC( (unsigned char *)m_MapData.c_str( ), m_MapData.size( ) );
            BYTEARRAY MapInfo = UTIL_CreateByteArray(crc, false );
            cout << crc << endl;
            cout << UTIL_ByteArrayToDecString( MapInfo ) << endl;

            return 0;
        }
    }

    return 1;
}