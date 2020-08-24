import {
    ByteUInt32,
    ByteExtractString,
    ByteDecodeToString,
    ByteToArrayBuffer,
    BytesExtract,
    ByteArray,
    encodeStatString,
    ByteString
} from "../../Bytes";

/*
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
 */

const GameFlags = 411650;

const mapFlags = ByteUInt32(GameFlags);
const mapWidth = BytesExtract("172 0", 2);
const mapHeight = BytesExtract("172 0", 2);
const mapCRC = BytesExtract("108 250 204 59", 4);
const mapPath = ByteString("Maps\\FrozenThrone\\(12)EmeraldGardens.w3x");
const hostName = ByteString("JiLiZART");

const statArray = [
    mapFlags,
    0, //filled in encodeStatString
    mapWidth,
    mapHeight,
    mapCRC,
    mapPath,
    hostName,
    0 //filled in encodeStatString
];

console.log('statArray', statArray);
const statBuffer = encodeStatString(ByteArray(statArray));

console.log('statString', ByteDecodeToString(statBuffer));
