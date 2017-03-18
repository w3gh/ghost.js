require('babel-register');

const os = require('os');
const path = require('path');
const hex = require('hex');
const bp = require('bufferpack');
const {BytesExtract} = require('./src/Bytes');
const BNCSUtil = require('./src/BNCSUtil').default;

//const war3ExePath26a = path.resolve('./war3/1.26a/war3.exe');
const war3ExePath26 = path.resolve('./war3/1.26/war3.exe');
const war3ExePath27 = path.resolve('./war3/1.27a/war3.exe');
const version = BNCSUtil.getVersion();
const info26 = BNCSUtil.getExeInfo(war3ExePath26, BNCSUtil.PLATFORM_X86);
//const info26 = BNCSUtil.getExeInfo(war3ExePath26, BNCSUtil.getPlatform());
const info27 = BNCSUtil.getExeInfo(war3ExePath27, BNCSUtil.getPlatform());
// const number = BNCSUtil.extractMPQNumber('IX86ver1.mpq');
// const key = BNCSUtil.nls_get_A(BNCSUtil.nls_init('jilizart', 'jilizart'));

// console.log('publicKey', key, key.length);
// console.log('mpq num', number);
console.log('bncs', version);
// console.log(info26a);
// console.log(bp.pack('<I', info26a.exeVersion).toJSON());

console.log('26');
console.log(BytesExtract('1 0 26 1').toJSON());
console.log(info26.exeVersion.toJSON());
console.log('27a');
console.log(info27.exeVersion.toJSON());
console.log(info27.exeVersion.toString());
