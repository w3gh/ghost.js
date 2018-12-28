#include "includes.h"
#include "sha1.h"
#include "util.h"

class CSHA1;

int main(int argc, char *argv[])
{
    if (argc > 1) {
        CSHA1 *m_SHA = new CSHA1( );
        m_SHA->Reset( );
        string m_MapData = UTIL_FileRead(argv[1]);

        if (!m_MapData.empty()) {
            m_SHA->Update( (unsigned char *)m_MapData.c_str( ), m_MapData.size( ) );
            m_SHA->Final( );
            unsigned char SHA1[20];
            memset( SHA1, 0, sizeof( unsigned char ) * 20 );
            m_SHA->GetHash( SHA1 );
            BYTEARRAY MapSHA1 = UTIL_CreateByteArray( SHA1, 20 );
//            cout << MapSHA1 << endl;
            cout << UTIL_ByteArrayToDecString( MapSHA1 ) << endl;

            return 0;
        }
    }

    return 1;
}