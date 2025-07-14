import {BNetSID} from "../../bnet/BNetSID";
import {IAuthInfo} from "../../bnet/IAuthInfo";
import {IAuthState} from "../../bnet/IAuthState";
import {IAccountLogon} from "../../bnet/IAccountLogon";
import {IAccountLogonProof} from "../../bnet/IAccountLogonProof";
import {IIncomingChatEvent} from "../../bnet/IIncomingChatEvent";
import {IIncomingFriend} from "../../bnet/IIncomingFriend";
import {IBNetSIDHandler} from "../../bnet/IBNetSIDHandler";
import {IBNetProtocol} from "../../bnet/IBNetProtocol";
import {createLoggerFor} from "../../Logger";
import {BNCSUtil} from '../../bncsutil/BNCSUtil';
import {IBNetConnection} from "../../bnet/IBNetConnection";

const {debug, info, error} = createLoggerFor('BNet_SID_Handler');

export class GhostBNetSIDHandler implements IBNetSIDHandler {
    [BNetSID.SID_PING](bnet: IBNetConnection, protocol: IBNetProtocol, d) {
        debug('HANDLE_SID_PING', d);
        bnet.emit('SID_PING', bnet, d);
        bnet.sendPackets(protocol.SEND_SID_PING(d));
    }

    [BNetSID.SID_NULL]() {
        debug('HANDLE_SID_NULL');
        // warning: we do not respond to NULL packets with a NULL packet of our own
        // bnet is because PVPGN servers are programmed to respond to NULL packets so it will create a vicious cycle of useless traffic
        // official battle.net servers do not respond to NULL packets
        return;
    }

    [BNetSID.SID_AUTH_INFO](bnet: IBNetConnection, protocol: IBNetProtocol, authInfo: IAuthInfo) {
        debug('HANDLE_SID_AUTH_INFO');

        const {
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo
        } = authInfo.handle(bnet);

        bnet.emit('SID_AUTH_INFO', bnet, authInfo);
        bnet.sendPackets(protocol.SEND_SID_AUTH_CHECK(
            bnet.TFT,
            bnet.clientToken,
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo,
            bnet.username
        ));
    }

    [BNetSID.SID_AUTH_CHECK](bnet: IBNetConnection, protocol: IBNetProtocol, auth: IAuthState) {
        debug('HANDLE_SID_AUTH_CHECK');

        if (auth.isValid()) {
            const clientPublicKey = auth.createClientPublicKey(bnet);

            info(`[${bnet.alias}] cd keys accepted`);

            bnet.emit('SID_AUTH_CHECK', bnet, auth);
            bnet.sendPackets(protocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, bnet.username));
        } else {
            bnet.disconnect();
        }
    }

    [BNetSID.SID_AUTH_ACCOUNTLOGON](bnet: IBNetConnection, protocol: IBNetProtocol, logon: IAccountLogon) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGON');

        if (logon.status > 0) {
            switch (logon.status) {
                case 1:
                    error(`logon failed - account doesn't exist`);
                    return;
                case 5:
                    error(`logon failed - account requires upgrade`);
                    return;
                default:
                    error(`logon failed - proof rejected with status ${logon.status}`);
                    return;
            }
        }

        info(`[${bnet.alias}] username ${bnet.username} accepted`);

        let data;

        if (bnet.passwordHashType === 'pvpgn') {
            info(`[${bnet.alias}] using pvpgn logon type (for pvpgn servers only)`);

            data = protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.hashPassword(bnet.password)
            );

        } else {
            info(`[${bnet.alias}] using battle.net logon type (for official battle.net servers only)`);

            data = protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.nls_get_M1(bnet.nls, logon.serverPublicKey, logon.salt)
            );
        }

        bnet.emit('SID_AUTH_ACCOUNTLOGON', bnet, logon);
        bnet.sendPackets(data);
    }

    [BNetSID.SID_AUTH_ACCOUNTLOGONPROOF](bnet: IBNetConnection, protocol: IBNetProtocol, logon: IAccountLogonProof) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');

        bnet.loggedIn = logon.isValid();

        info(`[${bnet.alias}] logon successful`);

        bnet.emit('SID_AUTH_ACCOUNTLOGONPROOF', bnet, logon);
        bnet.sendPackets([
            protocol.SEND_SID_NETGAMEPORT(bnet.hostPort),
            protocol.SEND_SID_ENTERCHAT(),
            protocol.SEND_SID_FRIENDSLIST(),
            protocol.SEND_SID_CLANMEMBERLIST(),
        ]);
    }

    [BNetSID.SID_ENTERCHAT](bnet: IBNetConnection, protocol: IBNetProtocol, d) {
        debug('HANDLE_SID_ENTERCHAT');

        if ('#' === d.toString()[0]) {
            debug('warning: account already logged in.');
        }

        info(`[${bnet.alias}] joining channel [${bnet.firstChannel}]`);

        bnet.inChat = true;

        bnet.emit('SID_ENTERCHAT', bnet, d);
        bnet.sendPackets(protocol.SEND_SID_JOINCHANNEL(bnet.firstChannel));
    }

    [BNetSID.SID_CHATEVENT](bnet: IBNetConnection, protocol: IBNetProtocol, e: IIncomingChatEvent) {
        debug('HANDLE_SID_CHATEVENT', e.idType(), e.user, e.message);

        bnet.emit('SID_CHATEVENT', bnet, e);
    }

    [BNetSID.SID_CLANINFO](bnet: IBNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANINFO');
    }

    [BNetSID.SID_CLANMEMBERLIST](bnet: IBNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANMEMBERLIST');
    }

    [BNetSID.SID_CLANMEMBERSTATUSCHANGE](bnet: IBNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
    }

    [BNetSID.SID_FRIENDSLIST](bnet: IBNetConnection, protocol: IBNetProtocol, friends: IIncomingFriend[]) {
        debug('HANDLE_SID_FRIENDSLIST');

        bnet.emit('SID_FRIENDSLIST', bnet, friends);
    }

    [BNetSID.SID_GETADVLISTEX](bnet: IBNetConnection, protocol: IBNetProtocol, d) {

    }

    [BNetSID.SID_FRIENDSADD](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FRIENDSADD');

        return;
    }

    [BNetSID.SID_FLOODDETECTED](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FLOODDETECTED');

        return;
    }

    [BNetSID.SID_FRIENDSUPDATE](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FRIENDSUPDATE');

        return;
    }

    [BNetSID.SID_MESSAGEBOX](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_MESSAGEBOX');

        return;
    }

    [BNetSID.SID_CLANINVITATION](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_CLANINVITATION');

        return;
    }

    [BNetSID.SID_CLANMEMBERREMOVED](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_CLANMEMBERREMOVED');

        return;
    }

    [BNetSID.SID_REQUIREDWORK](bnet: IBNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_REQUIREDWORK');

        return;
    }
}
