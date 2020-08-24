#include "includes.h"
#include "util.h"

void DEBUG_Print( string message )
{
	cout << message << endl;
}

void DEBUG_Print( BYTEARRAY b )
{
	cout << "{ ";

        for( unsigned int i = 0; i < b.size( ); ++i )
		cout << hex << (int)b[i] << " ";

	cout << "}" << endl;
}

int main()
{

    uint32_t GameFlags = 411650;

    BYTEARRAY mapFlags = UTIL_CreateByteArray( GameFlags, false );
    BYTEARRAY mapWidth = UTIL_ExtractNumbers("172 0", 2);
    BYTEARRAY mapHeight = UTIL_ExtractNumbers("172 0", 2);
    BYTEARRAY mapCRC = UTIL_ExtractNumbers("108 250 204 59", 4);
    string mapPath = "Maps\\FrozenThrone\\(12)EmeraldGardens.w3x";
    string hostName = "JiLiZART";

    BYTEARRAY StatString;
    UTIL_AppendByteArrayFast( StatString, mapFlags );
    StatString.push_back( 0 );
    UTIL_AppendByteArrayFast( StatString, mapWidth );
    UTIL_AppendByteArrayFast( StatString, mapHeight );
    UTIL_AppendByteArrayFast( StatString, mapCRC );
    UTIL_AppendByteArrayFast( StatString, mapPath );
    UTIL_AppendByteArrayFast( StatString, hostName );
    StatString.push_back( 0 );
    StatString = UTIL_EncodeStatString( StatString );

    DEBUG_Print( "mapFlags [" + UTIL_ByteArrayToDecString(mapFlags) + "]" );
    DEBUG_Print( "mapWidth [" + UTIL_ByteArrayToDecString(mapWidth) + "]" );
    DEBUG_Print( "mapHeight [" + UTIL_ByteArrayToDecString(mapHeight) + "]" );
    DEBUG_Print( "mapCRC [" + UTIL_ByteArrayToDecString(mapCRC) + "]" );
    DEBUG_Print( "mapPath [" + mapPath + "]" );
    DEBUG_Print( "hostName [" + hostName + "]" );
    DEBUG_Print( "StatString [" + UTIL_ByteArrayToDecString(StatString) + "]" );
}
