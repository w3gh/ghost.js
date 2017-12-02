
export class IncomingClanList {
    constructor(buff: Buffer) {

        // DEBUG_Print( "RECEIVED SID_CLANMEMBERSTATUSCHANGE" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // null terminated string	-> Name
        // 1 byte					-> Rank
        // 1 byte					-> Status
        // null terminated string	-> Location

        // if( ValidateLength( data ) && data.size( ) >= 5 )
        // {
        //     BYTEARRAY Name = UTIL_ExtractCString( data, 4 );
        //
        //     if( data.size( ) >= Name.size( ) + 7 )
        //     {
        //         unsigned char Rank = data[Name.size( ) + 5];
        //         unsigned char Status = data[Name.size( ) + 6];
        //
        //         // in the original VB source the location string is read but discarded, so that's what I do here
        //
        //         BYTEARRAY Location = UTIL_ExtractCString( data, Name.size( ) + 7 );
        //         return new CIncomingClanList(	string( Name.begin( ), Name.end( ) ),
        //                                         Rank,
        //                                         Status );
        //     }
        // }

    }
}
