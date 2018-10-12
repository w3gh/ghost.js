var FFI = require('ffi-napi'),
    ArrayType = require('ref-array'),
    Struct = require('ref-struct'),
    ref = require('ref');

var voidPtr = ref.refType(ref.types.void);

exports.CONSTANTS = {
  '': {
      FILESEC_OWNER: 1,
      FILESEC_GROUP: 2,
      FILESEC_UUID: 3,
      FILESEC_MODE: 4,
      FILESEC_ACL: 5,
      FILESEC_GRPUUID: 6,
      FILESEC_ACL_RAW: 100,
      FILESEC_ACL_ALLOCSIZE: 101,
      P_ALL: 0,
      P_PID: 1,
      P_PGID: 2,
      '1': 'FILESEC_OWNER',
      '2': 'FILESEC_GROUP',
      '3': 'FILESEC_UUID',
      '4': 'FILESEC_MODE',
      '5': 'FILESEC_ACL',
      '6': 'FILESEC_GRPUUID',
      '100': 'FILESEC_ACL_RAW',
      '101': 'FILESEC_ACL_ALLOCSIZE',
      '0': 'P_ALL',
      '1': 'P_PID',
      '2': 'P_PGID',
  },
  '_SFileInfoClass': {
      SFileMpqFileName: 0,
      SFileMpqStreamBitmap: 1,
      SFileMpqUserDataOffset: 2,
      SFileMpqUserDataHeader: 3,
      SFileMpqUserData: 4,
      SFileMpqHeaderOffset: 5,
      SFileMpqHeaderSize: 6,
      SFileMpqHeader: 7,
      SFileMpqHetTableOffset: 8,
      SFileMpqHetTableSize: 9,
      SFileMpqHetHeader: 10,
      SFileMpqHetTable: 11,
      SFileMpqBetTableOffset: 12,
      SFileMpqBetTableSize: 13,
      SFileMpqBetHeader: 14,
      SFileMpqBetTable: 15,
      SFileMpqHashTableOffset: 16,
      SFileMpqHashTableSize64: 17,
      SFileMpqHashTableSize: 18,
      SFileMpqHashTable: 19,
      SFileMpqBlockTableOffset: 20,
      SFileMpqBlockTableSize64: 21,
      SFileMpqBlockTableSize: 22,
      SFileMpqBlockTable: 23,
      SFileMpqHiBlockTableOffset: 24,
      SFileMpqHiBlockTableSize64: 25,
      SFileMpqHiBlockTable: 26,
      SFileMpqSignatures: 27,
      SFileMpqStrongSignatureOffset: 28,
      SFileMpqStrongSignatureSize: 29,
      SFileMpqStrongSignature: 30,
      SFileMpqArchiveSize64: 31,
      SFileMpqArchiveSize: 32,
      SFileMpqMaxFileCount: 33,
      SFileMpqFileTableSize: 34,
      SFileMpqSectorSize: 35,
      SFileMpqNumberOfFiles: 36,
      SFileMpqRawChunkSize: 37,
      SFileMpqStreamFlags: 38,
      SFileMpqFlags: 39,
      SFileInfoPatchChain: 40,
      SFileInfoFileEntry: 41,
      SFileInfoHashEntry: 42,
      SFileInfoHashIndex: 43,
      SFileInfoNameHash1: 44,
      SFileInfoNameHash2: 45,
      SFileInfoNameHash3: 46,
      SFileInfoLocale: 47,
      SFileInfoFileIndex: 48,
      SFileInfoByteOffset: 49,
      SFileInfoFileTime: 50,
      SFileInfoFileSize: 51,
      SFileInfoCompressedSize: 52,
      SFileInfoFlags: 53,
      SFileInfoEncryptionKey: 54,
      SFileInfoEncryptionKeyRaw: 55,
      SFileInfoCRC32: 56,
      '0': 'SFileMpqFileName',
      '1': 'SFileMpqStreamBitmap',
      '2': 'SFileMpqUserDataOffset',
      '3': 'SFileMpqUserDataHeader',
      '4': 'SFileMpqUserData',
      '5': 'SFileMpqHeaderOffset',
      '6': 'SFileMpqHeaderSize',
      '7': 'SFileMpqHeader',
      '8': 'SFileMpqHetTableOffset',
      '9': 'SFileMpqHetTableSize',
      '10': 'SFileMpqHetHeader',
      '11': 'SFileMpqHetTable',
      '12': 'SFileMpqBetTableOffset',
      '13': 'SFileMpqBetTableSize',
      '14': 'SFileMpqBetHeader',
      '15': 'SFileMpqBetTable',
      '16': 'SFileMpqHashTableOffset',
      '17': 'SFileMpqHashTableSize64',
      '18': 'SFileMpqHashTableSize',
      '19': 'SFileMpqHashTable',
      '20': 'SFileMpqBlockTableOffset',
      '21': 'SFileMpqBlockTableSize64',
      '22': 'SFileMpqBlockTableSize',
      '23': 'SFileMpqBlockTable',
      '24': 'SFileMpqHiBlockTableOffset',
      '25': 'SFileMpqHiBlockTableSize64',
      '26': 'SFileMpqHiBlockTable',
      '27': 'SFileMpqSignatures',
      '28': 'SFileMpqStrongSignatureOffset',
      '29': 'SFileMpqStrongSignatureSize',
      '30': 'SFileMpqStrongSignature',
      '31': 'SFileMpqArchiveSize64',
      '32': 'SFileMpqArchiveSize',
      '33': 'SFileMpqMaxFileCount',
      '34': 'SFileMpqFileTableSize',
      '35': 'SFileMpqSectorSize',
      '36': 'SFileMpqNumberOfFiles',
      '37': 'SFileMpqRawChunkSize',
      '38': 'SFileMpqStreamFlags',
      '39': 'SFileMpqFlags',
      '40': 'SFileInfoPatchChain',
      '41': 'SFileInfoFileEntry',
      '42': 'SFileInfoHashEntry',
      '43': 'SFileInfoHashIndex',
      '44': 'SFileInfoNameHash1',
      '45': 'SFileInfoNameHash2',
      '46': 'SFileInfoNameHash3',
      '47': 'SFileInfoLocale',
      '48': 'SFileInfoFileIndex',
      '49': 'SFileInfoByteOffset',
      '50': 'SFileInfoFileTime',
      '51': 'SFileInfoFileSize',
      '52': 'SFileInfoCompressedSize',
      '53': 'SFileInfoFlags',
      '54': 'SFileInfoEncryptionKey',
      '55': 'SFileInfoEncryptionKeyRaw',
      '56': 'SFileInfoCRC32',
  },
};

var filesec_t = exports.filesec_t = voidPtr;
var filesec_tPtr = exports.filesec_tPtr = ref.refType(filesec_t);
var fd_set = exports.fd_set = Struct({
  fds_bits: ArrayType(ref.types.int32, 32),
});
var fd_setPtr = exports.fd_setPtr = ref.refType(fd_set);
var sigset_t = exports.sigset_t = Struct({
  __darwin_sigset_t: ref.types.uint32,
});
var sigset_tPtr = exports.sigset_tPtr = ref.refType(sigset_t);
var uid_t = exports.uid_t = Struct({
  __darwin_uid_t: ref.types.uint32,
});
var uid_tPtr = exports.uid_tPtr = ref.refType(uid_t);
var gid_t = exports.gid_t = Struct({
  __darwin_gid_t: ref.types.uint32,
});
var gid_tPtr = exports.gid_tPtr = ref.refType(gid_t);
var siginfo_t = exports.siginfo_t = voidPtr;
var siginfo_tPtr = exports.siginfo_tPtr = ref.refType(siginfo_t);
var div_t = exports.div_t = Struct({
  quot: ref.types.int32,
  rem: ref.types.int32,
});
var div_tPtr = exports.div_tPtr = ref.refType(div_t);
var ldiv_t = exports.ldiv_t = Struct({
  quot: ref.types.long,
  rem: ref.types.long,
});
var ldiv_tPtr = exports.ldiv_tPtr = ref.refType(ldiv_t);
var lldiv_t = exports.lldiv_t = Struct({
  quot: ref.types.longlong,
  rem: ref.types.longlong,
});
var lldiv_tPtr = exports.lldiv_tPtr = ref.refType(lldiv_t);
var wchar_t = exports.wchar_t = Struct({
  __darwin_wchar_t: ref.types.int32,
});
var wchar_tPtr = exports.wchar_tPtr = ref.refType(wchar_t);
var TBitArray = exports.TBitArray = Struct({
  NumberOfBytes: ref.types.uint32,
  NumberOfBits: ref.types.uint32,
  Elements: ArrayType(ref.types.uchar, 1),
});
var TBitArrayPtr = exports.TBitArrayPtr = ref.refType(TBitArray);
var TFileStream = exports.TFileStream = voidPtr;
var TFileStreamPtr = exports.TFileStreamPtr = ref.refType(TFileStream);
var TCHAR = exports.TCHAR = voidPtr;
var TCHARPtr = exports.TCHARPtr = ref.refType(TCHAR);
var DWORD = exports.DWORD = voidPtr;
var DWORDPtr = exports.DWORDPtr = ref.refType(DWORD);
var SFILE_DOWNLOAD_CALLBACK = exports.SFILE_DOWNLOAD_CALLBACK = FFI.Function(ref.types.void, [
  voidPtr,
  ref.types.ulonglong,
  ref.types.uint32,
]);
var SFILE_DOWNLOAD_CALLBACKPtr = exports.SFILE_DOWNLOAD_CALLBACKPtr = ref.refType(SFILE_DOWNLOAD_CALLBACK);
var LPDWORD = exports.LPDWORD = voidPtr;
var LPDWORDPtr = exports.LPDWORDPtr = ref.refType(LPDWORD);
var ULONGLONG = exports.ULONGLONG = voidPtr;
var ULONGLONGPtr = exports.ULONGLONGPtr = ref.refType(ULONGLONG);
var HANDLE = exports.HANDLE = voidPtr;
var HANDLEPtr = exports.HANDLEPtr = ref.refType(HANDLE);
var _SFILE_CREATE_MPQ = exports._SFILE_CREATE_MPQ = Struct({
  cbSize: ref.types.uint32,
  dwMpqVersion: ref.types.uint32,
  pvUserData: voidPtr,
  cbUserData: ref.types.uint32,
  dwStreamFlags: ref.types.uint32,
  dwFileFlags1: ref.types.uint32,
  dwFileFlags2: ref.types.uint32,
  dwFileFlags3: ref.types.uint32,
  dwAttrFlags: ref.types.uint32,
  dwSectorSize: ref.types.uint32,
  dwRawChunkSize: ref.types.uint32,
  dwMaxFileCount: ref.types.uint32,
});
var _SFILE_CREATE_MPQPtr = exports._SFILE_CREATE_MPQPtr = ref.refType(_SFILE_CREATE_MPQ);
var SFILE_COMPACT_CALLBACK = exports.SFILE_COMPACT_CALLBACK = FFI.Function(ref.types.void, [
  voidPtr,
  ref.types.uint32,
  ref.types.ulonglong,
  ref.types.ulonglong,
]);
var SFILE_COMPACT_CALLBACKPtr = exports.SFILE_COMPACT_CALLBACKPtr = ref.refType(SFILE_COMPACT_CALLBACK);
var LONG = exports.LONG = voidPtr;
var LONGPtr = exports.LONGPtr = ref.refType(LONG);
var LPOVERLAPPED = exports.LPOVERLAPPED = voidPtr;
var LPOVERLAPPEDPtr = exports.LPOVERLAPPEDPtr = ref.refType(LPOVERLAPPED);
var SFILE_FIND_DATA = exports.SFILE_FIND_DATA = Struct({
  cFileName: ArrayType(ref.types.char, 1024),
  szPlainName: ref.types.CString,
  dwHashIndex: ref.types.uint32,
  dwBlockIndex: ref.types.uint32,
  dwFileSize: ref.types.uint32,
  dwFileFlags: ref.types.uint32,
  dwCompSize: ref.types.uint32,
  dwFileTimeLo: ref.types.uint32,
  dwFileTimeHi: ref.types.uint32,
  lcLocale: ref.types.uint32,
});
var SFILE_FIND_DATAPtr = exports.SFILE_FIND_DATAPtr = ref.refType(SFILE_FIND_DATA);
var LCID = exports.LCID = voidPtr;
var LCIDPtr = exports.LCIDPtr = ref.refType(LCID);
var SFILE_ADDFILE_CALLBACK = exports.SFILE_ADDFILE_CALLBACK = FFI.Function(ref.types.void, [
  voidPtr,
  ref.types.uint32,
  ref.types.uint32,
  ref.types.char,
]);
var SFILE_ADDFILE_CALLBACKPtr = exports.SFILE_ADDFILE_CALLBACKPtr = ref.refType(SFILE_ADDFILE_CALLBACK);

exports.Storm = new FFI.Library('Storm', {
  _OSSwapInt16: [ref.types.ushort, [
    ref.types.ushort,
  ]],
  _OSSwapInt32: [ref.types.uint32, [
    ref.types.uint32,
  ]],
  _OSSwapInt64: [ref.types.ulonglong, [
    ref.types.ulonglong,
  ]],
  __darwin_fd_isset: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  chmod: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  fchmod: [ref.types.int32, [
    ref.types.int32,
    ref.types.ushort,
  ]],
  fstat: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  lstat: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  mkdir: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  mkfifo: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  stat: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  mknod: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
    ref.types.int32,
  ]],
  umask: [ref.types.ushort, [
    ref.types.ushort,
  ]],
  fchmodat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.ushort,
    ref.types.int32,
  ]],
  fstatat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  mkdirat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.ushort,
  ]],
  chflags: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
  ]],
  chmodx_np: [ref.types.int32, [
    ref.types.CString,
    filesec_t,
  ]],
  fchflags: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
  ]],
  fchmodx_np: [ref.types.int32, [
    ref.types.int32,
    filesec_t,
  ]],
  fstatx_np: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    filesec_t,
  ]],
  lchflags: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
  ]],
  lchmod: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  lstatx_np: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    filesec_t,
  ]],
  mkdirx_np: [ref.types.int32, [
    ref.types.CString,
    filesec_t,
  ]],
  mkfifox_np: [ref.types.int32, [
    ref.types.CString,
    filesec_t,
  ]],
  statx_np: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    filesec_t,
  ]],
  umaskx_np: [ref.types.int32, [
    filesec_t,
  ]],
  fstatx64_np: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    filesec_t,
  ]],
  lstatx64_np: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    filesec_t,
  ]],
  statx64_np: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    filesec_t,
  ]],
  fstat64: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  lstat64: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  stat64: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  mlockall: [ref.types.int32, [
    ref.types.int32,
  ]],
  munlockall: [ref.types.int32, [
  ]],
  mlock: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
  ]],
  mmap: [voidPtr, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
    ref.types.int32,
    ref.types.int32,
    ref.types.longlong,
  ]],
  mprotect: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
  ]],
  msync: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
  ]],
  munlock: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
  ]],
  munmap: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
  ]],
  shm_open: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  shm_unlink: [ref.types.int32, [
    ref.types.CString,
  ]],
  posix_madvise: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
  ]],
  madvise: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
  ]],
  mincore: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.CString,
  ]],
  minherit: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.int32,
  ]],
  getattrlistbulk: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.ulonglong,
  ]],
  faccessat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.int32,
    ref.types.int32,
  ]],
  fchownat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    ref.types.int32,
  ]],
  linkat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.int32,
    ref.types.CString,
    ref.types.int32,
  ]],
  readlinkat: [ref.types.long, [
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
    ref.types.ulong,
  ]],
  symlinkat: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
    ref.types.CString,
  ]],
  unlinkat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.int32,
  ]],
  getattrlistat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
  ]],
  _exit: [ref.types.void, [
    ref.types.int32,
  ]],
  access: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  alarm: [ref.types.uint32, [
    ref.types.uint32,
  ]],
  chdir: [ref.types.int32, [
    ref.types.CString,
  ]],
  chown: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  close: [ref.types.int32, [
    ref.types.int32,
  ]],
  dup: [ref.types.int32, [
    ref.types.int32,
  ]],
  dup2: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  execl: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  execle: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  execlp: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  execv: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  execve: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    voidPtr,
  ]],
  execvp: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
  ]],
  fork: [ref.types.int32, [
  ]],
  fpathconf: [ref.types.long, [
    ref.types.int32,
    ref.types.int32,
  ]],
  getcwd: [ref.types.CString, [
    ref.types.CString,
    ref.types.ulong,
  ]],
  getegid: [ref.types.uint32, [
  ]],
  geteuid: [ref.types.uint32, [
  ]],
  getgid: [ref.types.uint32, [
  ]],
  getlogin: [ref.types.CString, [
  ]],
  getpgrp: [ref.types.int32, [
  ]],
  getpid: [ref.types.int32, [
  ]],
  getppid: [ref.types.int32, [
  ]],
  getuid: [ref.types.uint32, [
  ]],
  isatty: [ref.types.int32, [
    ref.types.int32,
  ]],
  link: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  lseek: [ref.types.longlong, [
    ref.types.int32,
    ref.types.longlong,
    ref.types.int32,
  ]],
  pathconf: [ref.types.long, [
    ref.types.CString,
    ref.types.int32,
  ]],
  pause: [ref.types.int32, [
  ]],
  pipe: [ref.types.int32, [
    ref.types.int32,
  ]],
  read: [ref.types.long, [
    ref.types.int32,
    voidPtr,
    ref.types.ulong,
  ]],
  rmdir: [ref.types.int32, [
    ref.types.CString,
  ]],
  setgid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  setpgid: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  setsid: [ref.types.int32, [
  ]],
  setuid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  sleep: [ref.types.uint32, [
    ref.types.uint32,
  ]],
  sysconf: [ref.types.long, [
    ref.types.int32,
  ]],
  tcgetpgrp: [ref.types.int32, [
    ref.types.int32,
  ]],
  tcsetpgrp: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  ttyname: [ref.types.CString, [
    ref.types.int32,
  ]],
  ttyname_r: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.ulong,
  ]],
  unlink: [ref.types.int32, [
    ref.types.CString,
  ]],
  write: [ref.types.long, [
    ref.types.int32,
    voidPtr,
    ref.types.ulong,
  ]],
  confstr: [ref.types.ulong, [
    ref.types.int32,
    ref.types.CString,
    ref.types.ulong,
  ]],
  brk: [voidPtr, [
    voidPtr,
  ]],
  chroot: [ref.types.int32, [
    ref.types.CString,
  ]],
  crypt: [ref.types.CString, [
    ref.types.CString,
    ref.types.CString,
  ]],
  ctermid: [ref.types.CString, [
    ref.types.CString,
  ]],
  encrypt: [ref.types.void, [
    ref.types.CString,
    ref.types.int32,
  ]],
  fchdir: [ref.types.int32, [
    ref.types.int32,
  ]],
  gethostid: [ref.types.long, [
  ]],
  getpgid: [ref.types.int32, [
    ref.types.int32,
  ]],
  getsid: [ref.types.int32, [
    ref.types.int32,
  ]],
  getdtablesize: [ref.types.int32, [
  ]],
  getpagesize: [ref.types.int32, [
  ]],
  getpass: [ref.types.CString, [
    ref.types.CString,
  ]],
  getwd: [ref.types.CString, [
    ref.types.CString,
  ]],
  lchown: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  lockf: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
    ref.types.longlong,
  ]],
  nice: [ref.types.int32, [
    ref.types.int32,
  ]],
  pread: [ref.types.long, [
    ref.types.int32,
    voidPtr,
    ref.types.ulong,
    ref.types.longlong,
  ]],
  pwrite: [ref.types.long, [
    ref.types.int32,
    voidPtr,
    ref.types.ulong,
    ref.types.longlong,
  ]],
  sbrk: [voidPtr, [
    ref.types.int32,
  ]],
  setpgrp: [ref.types.int32, [
  ]],
  setregid: [ref.types.int32, [
    ref.types.uint32,
    ref.types.uint32,
  ]],
  setreuid: [ref.types.int32, [
    ref.types.uint32,
    ref.types.uint32,
  ]],
  swab: [ref.types.void, [
    voidPtr,
    voidPtr,
    ref.types.long,
  ]],
  sync: [ref.types.void, [
  ]],
  truncate: [ref.types.int32, [
    ref.types.CString,
    ref.types.longlong,
  ]],
  ualarm: [ref.types.uint32, [
    ref.types.uint32,
    ref.types.uint32,
  ]],
  usleep: [ref.types.int32, [
    ref.types.uint32,
  ]],
  vfork: [ref.types.int32, [
  ]],
  fsync: [ref.types.int32, [
    ref.types.int32,
  ]],
  ftruncate: [ref.types.int32, [
    ref.types.int32,
    ref.types.longlong,
  ]],
  getlogin_r: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
  ]],
  fchown: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  gethostname: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
  ]],
  readlink: [ref.types.long, [
    ref.types.CString,
    ref.types.CString,
    ref.types.ulong,
  ]],
  setegid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  seteuid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  symlink: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  pselect: [ref.types.int32, [
    ref.types.int32,
    fd_setPtr,
    fd_setPtr,
    fd_setPtr,
    voidPtr,
    sigset_tPtr,
  ]],
  select: [ref.types.int32, [
    ref.types.int32,
    fd_setPtr,
    fd_setPtr,
    fd_setPtr,
    voidPtr,
  ]],
  _Exit: [ref.types.void, [
    ref.types.int32,
  ]],
  accessx_np: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.refType(ref.types.int32),
    ref.types.uint32,
  ]],
  acct: [ref.types.int32, [
    ref.types.CString,
  ]],
  add_profil: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  endusershell: [ref.types.void, [
  ]],
  execvP: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    voidPtr,
  ]],
  fflagstostr: [ref.types.CString, [
    ref.types.ulong,
  ]],
  getdomainname: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  getgrouplist: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
    ref.refType(ref.types.int32),
    ref.refType(ref.types.int32),
  ]],
  gethostuuid: [ref.types.int32, [
    ref.types.uchar,
    voidPtr,
  ]],
  getmode: [ref.types.ushort, [
    voidPtr,
    ref.types.ushort,
  ]],
  getpeereid: [ref.types.int32, [
    ref.types.int32,
    uid_tPtr,
    gid_tPtr,
  ]],
  getsgroups_np: [ref.types.int32, [
    ref.refType(ref.types.int32),
    ref.types.uchar,
  ]],
  getusershell: [ref.types.CString, [
  ]],
  getwgroups_np: [ref.types.int32, [
    ref.refType(ref.types.int32),
    ref.types.uchar,
  ]],
  initgroups: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  iruserok: [ref.types.int32, [
    ref.types.ulong,
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
  ]],
  iruserok_sa: [ref.types.int32, [
    voidPtr,
    ref.types.int32,
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
  ]],
  issetugid: [ref.types.int32, [
  ]],
  mkdtemp: [ref.types.CString, [
    ref.types.CString,
  ]],
  mknod: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
    ref.types.int32,
  ]],
  mkpath_np: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  mkstemp: [ref.types.int32, [
    ref.types.CString,
  ]],
  mkstemps: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  mktemp: [ref.types.CString, [
    ref.types.CString,
  ]],
  nfssvc: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  profil: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  pthread_setugid_np: [ref.types.int32, [
    ref.types.uint32,
    ref.types.uint32,
  ]],
  pthread_getugid_np: [ref.types.int32, [
    uid_tPtr,
    gid_tPtr,
  ]],
  rcmd: [ref.types.int32, [
    voidPtr,
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.refType(ref.types.int32),
  ]],
  rcmd_af: [ref.types.int32, [
    voidPtr,
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.refType(ref.types.int32),
    ref.types.int32,
  ]],
  reboot: [ref.types.int32, [
    ref.types.int32,
  ]],
  revoke: [ref.types.int32, [
    ref.types.CString,
  ]],
  rresvport: [ref.types.int32, [
    ref.refType(ref.types.int32),
  ]],
  rresvport_af: [ref.types.int32, [
    ref.refType(ref.types.int32),
    ref.types.int32,
  ]],
  ruserok: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
    ref.types.CString,
    ref.types.CString,
  ]],
  setdomainname: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  setgroups: [ref.types.int32, [
    ref.types.int32,
    gid_tPtr,
  ]],
  sethostid: [ref.types.void, [
    ref.types.long,
  ]],
  sethostname: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  setkey: [ref.types.void, [
    ref.types.CString,
  ]],
  setlogin: [ref.types.int32, [
    ref.types.CString,
  ]],
  setmode: [voidPtr, [
    ref.types.CString,
  ]],
  setrgid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  setruid: [ref.types.int32, [
    ref.types.uint32,
  ]],
  setsgroups_np: [ref.types.int32, [
    ref.types.int32,
    ref.types.uchar,
  ]],
  setusershell: [ref.types.void, [
  ]],
  setwgroups_np: [ref.types.int32, [
    ref.types.int32,
    ref.types.uchar,
  ]],
  strtofflags: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.ulong),
    ref.refType(ref.types.ulong),
  ]],
  swapon: [ref.types.int32, [
    ref.types.CString,
  ]],
  syscall: [ref.types.int32, [
    ref.types.int32,
  ]],
  ttyslot: [ref.types.int32, [
  ]],
  undelete: [ref.types.int32, [
    ref.types.CString,
  ]],
  unwhiteout: [ref.types.int32, [
    ref.types.CString,
  ]],
  valloc: [voidPtr, [
    ref.types.ulong,
  ]],
  getsubopt: [ref.types.int32, [
    voidPtr,
    voidPtr,
    voidPtr,
  ]],
  fgetattrlist: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  fsetattrlist: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  getattrlist: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  setattrlist: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.uint32,
  ]],
  exchangedata: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.uint32,
  ]],
  getdirentriesattr: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.refType(ref.types.uint32),
    ref.refType(ref.types.uint32),
    ref.refType(ref.types.uint32),
    ref.types.uint32,
  ]],
  searchfs: [ref.types.int32, [
    ref.types.CString,
    voidPtr,
    ref.refType(ref.types.ulong),
    ref.types.uint32,
    ref.types.uint32,
    voidPtr,
  ]],
  fsctl: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
    voidPtr,
    ref.types.uint32,
  ]],
  ffsctl: [ref.types.int32, [
    ref.types.int32,
    ref.types.ulong,
    voidPtr,
    ref.types.uint32,
  ]],
  fsync_volume_np: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  sync_volume_np: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  open: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  openat: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
    ref.types.int32,
  ]],
  creat: [ref.types.int32, [
    ref.types.CString,
    ref.types.ushort,
  ]],
  fcntl: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  openx_np: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
    filesec_t,
  ]],
  open_dprotected_np: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
    ref.types.int32,
    ref.types.int32,
  ]],
  flock: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  filesec_init: [filesec_t, [
  ]],
  filesec_dup: [filesec_t, [
    filesec_t,
  ]],
  filesec_free: [ref.types.void, [
    filesec_t,
  ]],
  filesec_get_property: [ref.types.int32, [
    filesec_t,
    ref.types.uint32,
    voidPtr,
  ]],
  filesec_query_property: [ref.types.int32, [
    filesec_t,
    ref.types.uint32,
    ref.refType(ref.types.int32),
  ]],
  filesec_set_property: [ref.types.int32, [
    filesec_t,
    ref.types.uint32,
    voidPtr,
  ]],
  filesec_unset_property: [ref.types.int32, [
    filesec_t,
    ref.types.uint32,
  ]],
  signal: [voidPtr, [
    ref.types.int32,
    voidPtr,
  ]],
  getpriority: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
  ]],
  getiopolicy_np: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  getrlimit: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  getrusage: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  setpriority: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
    ref.types.int32,
  ]],
  setiopolicy_np: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
    ref.types.int32,
  ]],
  setrlimit: [ref.types.int32, [
    ref.types.int32,
    voidPtr,
  ]],
  wait: [ref.types.int32, [
    ref.refType(ref.types.int32),
  ]],
  waitpid: [ref.types.int32, [
    ref.types.int32,
    ref.refType(ref.types.int32),
    ref.types.int32,
  ]],
  waitid: [ref.types.int32, [
    ref.types.uint32,
    ref.types.uint32,
    siginfo_t,
    ref.types.int32,
  ]],
  wait3: [ref.types.int32, [
    ref.refType(ref.types.int32),
    ref.types.int32,
    voidPtr,
  ]],
  wait4: [ref.types.int32, [
    ref.types.int32,
    ref.refType(ref.types.int32),
    ref.types.int32,
    voidPtr,
  ]],
  alloca: [voidPtr, [
    ref.types.ulong,
  ]],
  abort: [ref.types.void, [
  ]],
  abs: [ref.types.int32, [
    ref.types.int32,
  ]],
  atexit: [ref.types.int32, [
    voidPtr,
  ]],
  atof: [ref.types.double, [
    ref.types.CString,
  ]],
  atoi: [ref.types.int32, [
    ref.types.CString,
  ]],
  atol: [ref.types.long, [
    ref.types.CString,
  ]],
  atoll: [ref.types.longlong, [
    ref.types.CString,
  ]],
  bsearch: [voidPtr, [
    voidPtr,
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
  ]],
  calloc: [voidPtr, [
    ref.types.ulong,
    ref.types.ulong,
  ]],
  div: [div_t, [
    ref.types.int32,
    ref.types.int32,
  ]],
  exit: [ref.types.void, [
    ref.types.int32,
  ]],
  free: [ref.types.void, [
    voidPtr,
  ]],
  getenv: [ref.types.CString, [
    ref.types.CString,
  ]],
  labs: [ref.types.long, [
    ref.types.long,
  ]],
  ldiv: [ldiv_t, [
    ref.types.long,
    ref.types.long,
  ]],
  llabs: [ref.types.longlong, [
    ref.types.longlong,
  ]],
  lldiv: [lldiv_t, [
    ref.types.longlong,
    ref.types.longlong,
  ]],
  malloc: [voidPtr, [
    ref.types.ulong,
  ]],
  mblen: [ref.types.int32, [
    ref.types.CString,
    ref.types.ulong,
  ]],
  mbstowcs: [ref.types.ulong, [
    wchar_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  mbtowc: [ref.types.int32, [
    wchar_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  posix_memalign: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
  ]],
  qsort: [ref.types.void, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
  ]],
  rand: [ref.types.int32, [
  ]],
  realloc: [voidPtr, [
    voidPtr,
    ref.types.ulong,
  ]],
  srand: [ref.types.void, [
    ref.types.uint32,
  ]],
  strtod: [ref.types.double, [
    ref.types.CString,
    voidPtr,
  ]],
  strtof: [ref.types.float, [
    ref.types.CString,
    voidPtr,
  ]],
  strtol: [ref.types.long, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  strtoll: [ref.types.longlong, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  strtoul: [ref.types.ulong, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  strtoull: [ref.types.ulonglong, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  system: [ref.types.int32, [
    ref.types.CString,
  ]],
  wcstombs: [ref.types.ulong, [
    ref.types.CString,
    wchar_tPtr,
    ref.types.ulong,
  ]],
  wctomb: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  _Exit: [ref.types.void, [
    ref.types.int32,
  ]],
  a64l: [ref.types.long, [
    ref.types.CString,
  ]],
  drand48: [ref.types.double, [
  ]],
  ecvt: [ref.types.CString, [
    ref.types.double,
    ref.types.int32,
    ref.refType(ref.types.int32),
    ref.refType(ref.types.int32),
  ]],
  erand48: [ref.types.double, [
    ref.types.ushort,
  ]],
  fcvt: [ref.types.CString, [
    ref.types.double,
    ref.types.int32,
    ref.refType(ref.types.int32),
    ref.refType(ref.types.int32),
  ]],
  gcvt: [ref.types.CString, [
    ref.types.double,
    ref.types.int32,
    ref.types.CString,
  ]],
  getsubopt: [ref.types.int32, [
    voidPtr,
    voidPtr,
    voidPtr,
  ]],
  grantpt: [ref.types.int32, [
    ref.types.int32,
  ]],
  initstate: [ref.types.CString, [
    ref.types.uint32,
    ref.types.CString,
    ref.types.ulong,
  ]],
  jrand48: [ref.types.long, [
    ref.types.ushort,
  ]],
  l64a: [ref.types.CString, [
    ref.types.long,
  ]],
  lcong48: [ref.types.void, [
    ref.types.ushort,
  ]],
  lrand48: [ref.types.long, [
  ]],
  mktemp: [ref.types.CString, [
    ref.types.CString,
  ]],
  mkstemp: [ref.types.int32, [
    ref.types.CString,
  ]],
  mrand48: [ref.types.long, [
  ]],
  nrand48: [ref.types.long, [
    ref.types.ushort,
  ]],
  posix_openpt: [ref.types.int32, [
    ref.types.int32,
  ]],
  ptsname: [ref.types.CString, [
    ref.types.int32,
  ]],
  putenv: [ref.types.int32, [
    ref.types.CString,
  ]],
  random: [ref.types.long, [
  ]],
  rand_r: [ref.types.int32, [
    ref.refType(ref.types.uint32),
  ]],
  realpath: [ref.types.CString, [
    ref.types.CString,
    ref.types.CString,
  ]],
  seed48: [ref.refType(ref.types.ushort), [
    ref.types.ushort,
  ]],
  setenv: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.int32,
  ]],
  setkey: [ref.types.void, [
    ref.types.CString,
  ]],
  setstate: [ref.types.CString, [
    ref.types.CString,
  ]],
  srand48: [ref.types.void, [
    ref.types.long,
  ]],
  srandom: [ref.types.void, [
    ref.types.uint32,
  ]],
  unlockpt: [ref.types.int32, [
    ref.types.int32,
  ]],
  unsetenv: [ref.types.int32, [
    ref.types.CString,
  ]],
  arc4random: [ref.types.uint32, [
  ]],
  arc4random_addrandom: [ref.types.void, [
    ref.refType(ref.types.uchar),
    ref.types.int32,
  ]],
  arc4random_buf: [ref.types.void, [
    voidPtr,
    ref.types.ulong,
  ]],
  arc4random_stir: [ref.types.void, [
  ]],
  arc4random_uniform: [ref.types.uint32, [
    ref.types.uint32,
  ]],
  cgetcap: [ref.types.CString, [
    ref.types.CString,
    ref.types.CString,
    ref.types.int32,
  ]],
  cgetclose: [ref.types.int32, [
  ]],
  cgetent: [ref.types.int32, [
    voidPtr,
    voidPtr,
    ref.types.CString,
  ]],
  cgetfirst: [ref.types.int32, [
    voidPtr,
    voidPtr,
  ]],
  cgetmatch: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
  ]],
  cgetnext: [ref.types.int32, [
    voidPtr,
    voidPtr,
  ]],
  cgetnum: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.refType(ref.types.long),
  ]],
  cgetset: [ref.types.int32, [
    ref.types.CString,
  ]],
  cgetstr: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    voidPtr,
  ]],
  cgetustr: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    voidPtr,
  ]],
  daemon: [ref.types.int32, [
    ref.types.int32,
    ref.types.int32,
  ]],
  devname: [ref.types.CString, [
    ref.types.int32,
    ref.types.ushort,
  ]],
  devname_r: [ref.types.CString, [
    ref.types.int32,
    ref.types.ushort,
    ref.types.CString,
    ref.types.int32,
  ]],
  getbsize: [ref.types.CString, [
    ref.refType(ref.types.int32),
    ref.refType(ref.types.long),
  ]],
  getprogname: [ref.types.CString, [
  ]],
  heapsort: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
  ]],
  mergesort: [ref.types.int32, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
  ]],
  psort: [ref.types.void, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
  ]],
  psort_r: [ref.types.void, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
    voidPtr,
  ]],
  qsort_r: [ref.types.void, [
    voidPtr,
    ref.types.ulong,
    ref.types.ulong,
    voidPtr,
    voidPtr,
  ]],
  radixsort: [ref.types.int32, [
    voidPtr,
    ref.types.int32,
    ref.refType(ref.types.uchar),
    ref.types.uint32,
  ]],
  setprogname: [ref.types.void, [
    ref.types.CString,
  ]],
  sradixsort: [ref.types.int32, [
    voidPtr,
    ref.types.int32,
    ref.refType(ref.types.uchar),
    ref.types.uint32,
  ]],
  sranddev: [ref.types.void, [
  ]],
  srandomdev: [ref.types.void, [
  ]],
  reallocf: [voidPtr, [
    voidPtr,
    ref.types.ulong,
  ]],
  strtoq: [ref.types.longlong, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  strtouq: [ref.types.ulonglong, [
    ref.types.CString,
    voidPtr,
    ref.types.int32,
  ]],
  valloc: [voidPtr, [
    ref.types.ulong,
  ]],
  __error: [ref.refType(ref.types.int32), [
  ]],
  GetBits: [ref.types.void, [
    TBitArrayPtr,
    ref.types.uint32,
    ref.types.uint32,
    voidPtr,
    ref.types.int32,
  ]],
  SetBits: [ref.types.void, [
    TBitArrayPtr,
    ref.types.uint32,
    ref.types.uint32,
    voidPtr,
    ref.types.int32,
  ]],
  FileStream_CreateFile: [TFileStream, [
    TCHAR,
    ref.types.uint32,
  ]],
  FileStream_OpenFile: [TFileStreamPtr, [
    TCHARPtr,
    ref.types.uint32,
  ]],
  FileStream_GetFileName: [TCHARPtr, [
    TFileStreamPtr,
  ]],
  FileStream_Prefix: [ref.types.ulong, [
    TCHARPtr,
    DWORD,
  ]],
  FileStream_SetCallback: [ref.types.char, [
    TFileStreamPtr,
    SFILE_DOWNLOAD_CALLBACK,
    voidPtr,
  ]],
  FileStream_GetBitmap: [ref.types.char, [
    TFileStreamPtr,
    voidPtr,
    ref.types.uint32,
    LPDWORD,
  ]],
  FileStream_Read: [ref.types.char, [
    TFileStreamPtr,
    ULONGLONG,
    voidPtr,
    ref.types.uint32,
  ]],
  FileStream_Write: [ref.types.char, [
    TFileStreamPtr,
    ULONGLONGPtr,
    voidPtr,
    ref.types.uint32,
  ]],
  FileStream_SetSize: [ref.types.char, [
    TFileStreamPtr,
    ref.types.ulonglong,
  ]],
  FileStream_GetSize: [ref.types.char, [
    TFileStreamPtr,
    ULONGLONGPtr,
  ]],
  FileStream_GetPos: [ref.types.char, [
    TFileStreamPtr,
    ULONGLONGPtr,
  ]],
  FileStream_GetTime: [ref.types.char, [
    TFileStreamPtr,
    ULONGLONGPtr,
  ]],
  FileStream_GetFlags: [ref.types.char, [
    TFileStreamPtr,
    LPDWORD,
  ]],
  FileStream_Replace: [ref.types.char, [
    TFileStreamPtr,
    TFileStreamPtr,
  ]],
  FileStream_Close: [ref.types.void, [
    TFileStreamPtr,
  ]],
  SFileGetLocale: [ref.types.uint32, [
  ]],
  SFileSetLocale: [ref.types.uint32, [
    ref.types.uint32,
  ]],
  SFileOpenArchive: [ref.types.char, [
    TCHARPtr,
    ref.types.uint32,
    ref.types.uint32,
    HANDLE,
  ]],
  SFileCreateArchive: [ref.types.char, [
    TCHARPtr,
    ref.types.uint32,
    ref.types.uint32,
    HANDLEPtr,
  ]],
  SFileCreateArchive2: [ref.types.char, [
    TCHARPtr,
    _SFILE_CREATE_MPQPtr,
    HANDLEPtr,
  ]],
  SFileSetDownloadCallback: [ref.types.char, [
    HANDLE,
    SFILE_DOWNLOAD_CALLBACK,
    voidPtr,
  ]],
  SFileFlushArchive: [ref.types.char, [
    HANDLE,
  ]],
  SFileCloseArchive: [ref.types.char, [
    HANDLE,
  ]],
  SFileAddListFile: [ref.types.int32, [
    HANDLE,
    ref.types.CString,
  ]],
  SFileSetCompactCallback: [ref.types.char, [
    HANDLE,
    SFILE_COMPACT_CALLBACK,
    voidPtr,
  ]],
  SFileCompactArchive: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    ref.types.char,
  ]],
  SFileGetMaxFileCount: [ref.types.uint32, [
    HANDLE,
  ]],
  SFileSetMaxFileCount: [ref.types.char, [
    HANDLE,
    ref.types.uint32,
  ]],
  SFileGetAttributes: [ref.types.uint32, [
    HANDLE,
  ]],
  SFileSetAttributes: [ref.types.char, [
    HANDLE,
    ref.types.uint32,
  ]],
  SFileUpdateFileAttributes: [ref.types.char, [
    HANDLE,
    ref.types.CString,
  ]],
  SFileOpenPatchArchive: [ref.types.char, [
    HANDLE,
    TCHARPtr,
    ref.types.CString,
    ref.types.uint32,
  ]],
  SFileIsPatchedArchive: [ref.types.char, [
    HANDLE,
  ]],
  SFileHasFile: [ref.types.char, [
    HANDLE,
    ref.types.CString,
  ]],
  SFileOpenFileEx: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    ref.types.uint32,
    HANDLEPtr,
  ]],
  SFileGetFileSize: [ref.types.uint32, [
    HANDLE,
    LPDWORD,
  ]],
  SFileSetFilePointer: [ref.types.uint32, [
    HANDLE,
    ref.types.int32,
    LONG,
    ref.types.uint32,
  ]],
  SFileReadFile: [ref.types.char, [
    HANDLE,
    voidPtr,
    ref.types.uint32,
    LPDWORD,
    LPOVERLAPPED,
  ]],
  SFileCloseFile: [ref.types.char, [
    HANDLE,
  ]],
  SFileGetFileInfo: [ref.types.char, [
    HANDLE,
    ref.types.uint32,
    voidPtr,
    ref.types.uint32,
    LPDWORD,
  ]],
  SFileGetFileName: [ref.types.char, [
    HANDLE,
    ref.types.CString,
  ]],
  SFileFreeFileInfo: [ref.types.char, [
    voidPtr,
    ref.types.uint32,
  ]],
  SFileExtractFile: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    TCHARPtr,
    ref.types.uint32,
  ]],
  SFileGetFileChecksums: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    LPDWORD,
    ref.types.CString,
  ]],
  SFileVerifyFile: [ref.types.uint32, [
    HANDLE,
    ref.types.CString,
    ref.types.uint32,
  ]],
  SFileVerifyRawData: [ref.types.int32, [
    HANDLE,
    ref.types.uint32,
    ref.types.CString,
  ]],
  SFileSignArchive: [ref.types.char, [
    HANDLE,
    ref.types.uint32,
  ]],
  SFileVerifyArchive: [ref.types.uint32, [
    HANDLE,
  ]],
  SFileFindFirstFile: [HANDLE, [
    HANDLE,
    ref.types.CString,
    SFILE_FIND_DATAPtr,
    ref.types.CString,
  ]],
  SFileFindNextFile: [ref.types.char, [
    HANDLE,
    SFILE_FIND_DATAPtr,
  ]],
  SFileFindClose: [ref.types.char, [
    HANDLE,
  ]],
  SListFileFindFirstFile: [HANDLE, [
    HANDLE,
    ref.types.CString,
    ref.types.CString,
    SFILE_FIND_DATAPtr,
  ]],
  SListFileFindNextFile: [ref.types.char, [
    HANDLE,
    SFILE_FIND_DATAPtr,
  ]],
  SListFileFindClose: [ref.types.char, [
    HANDLE,
  ]],
  SFileEnumLocales: [ref.types.int32, [
    HANDLE,
    ref.types.CString,
    LCID,
    LPDWORD,
    ref.types.uint32,
  ]],
  SFileCreateFile: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    ref.types.ulonglong,
    ref.types.uint32,
    ref.types.uint32,
    ref.types.uint32,
    HANDLEPtr,
  ]],
  SFileWriteFile: [ref.types.char, [
    HANDLE,
    voidPtr,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  SFileFinishFile: [ref.types.char, [
    HANDLE,
  ]],
  SFileAddFileEx: [ref.types.char, [
    HANDLE,
    TCHARPtr,
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  SFileAddFile: [ref.types.char, [
    HANDLE,
    TCHARPtr,
    ref.types.CString,
    ref.types.uint32,
  ]],
  SFileAddWave: [ref.types.char, [
    HANDLE,
    TCHARPtr,
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  SFileRemoveFile: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    ref.types.uint32,
  ]],
  SFileRenameFile: [ref.types.char, [
    HANDLE,
    ref.types.CString,
    ref.types.CString,
  ]],
  SFileSetFileLocale: [ref.types.char, [
    HANDLE,
    ref.types.uint32,
  ]],
  SFileSetDataCompression: [ref.types.char, [
    ref.types.uint32,
  ]],
  SFileSetAddFileCallback: [ref.types.char, [
    HANDLE,
    SFILE_ADDFILE_CALLBACK,
    voidPtr,
  ]],
  SCompImplode: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.int32),
    voidPtr,
    ref.types.int32,
  ]],
  SCompExplode: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.int32),
    voidPtr,
    ref.types.int32,
  ]],
  SCompCompress: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.int32),
    voidPtr,
    ref.types.int32,
    ref.types.uint32,
    ref.types.int32,
    ref.types.int32,
  ]],
  SCompDecompress: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.int32),
    voidPtr,
    ref.types.int32,
  ]],
  SCompDecompress2: [ref.types.int32, [
    voidPtr,
    ref.refType(ref.types.int32),
    voidPtr,
    ref.types.int32,
  ]],
  // SetLastError: [ref.types.void, [
  //   ref.types.int32,
  // ]],
  // GetLastError: [ref.types.int32, [
  // ]],
});

