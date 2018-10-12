var FFI = require('ffi-napi'),
    Struct = require('ref-struct'),
    ref = require('ref'),
    path = require('path');

var voidPtr = ref.refType(ref.types.void);

exports.CONSTANTS = {
  '': {
      P_ALL: 0,
      P_PID: 1,
      P_PGID: 2,
      '0': 'P_ALL',
      '1': 'P_PID',
      '2': 'P_PGID',
  },
};

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
var uint32_t = exports.uint32_t = voidPtr;
var uint32_tPtr = exports.uint32_tPtr = ref.refType(uint32_t);
var nls_t = exports.nls_t = voidPtr;
var nls_tPtr = exports.nls_tPtr = ref.refType(nls_t);

var platform = process.platform;
var libPath = null;
var cwd = process.cwd();

if (platform === 'win32'){
    libPath = '/libbncsutil.dll';
}else if(platform === 'linux'){
    libPath = '/libbncsutil.so';
}else if(platform === 'darwin'){
    libPath = '/libbncsutil.dylib';
}else{
    throw new Error('unsupported plateform for mathlibLoc');
}

exports.libbncsutil = new FFI.Library(path.resolve(cwd + libPath), {
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
  // _OSSwapInt16: [ref.types.ushort, [
  //   ref.types.ushort,
  // ]],
  // _OSSwapInt32: [ref.types.uint32, [
  //   ref.types.uint32,
  // ]],
  // _OSSwapInt64: [ref.types.ulonglong, [
  //   ref.types.ulonglong,
  // ]],
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
  // alloca: [voidPtr, [
  //   ref.types.ulong,
  // ]],
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
  extractMPQNumber: [ref.types.int32, [
    ref.types.CString,
  ]],
  checkRevisionFlat: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.int32,
    ref.refType(ref.types.ulong),
  ]],
  getExeInfo: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.ulong,
    uint32_t,
    ref.types.int32,
  ]],
  get_mpq_seed: [ref.types.long, [
    ref.types.int32,
  ]],
  set_mpq_seed: [ref.types.long, [
    ref.types.int32,
    ref.types.long,
  ]],
  calcHashBuf: [ref.types.void, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
  ]],
  // bsha1_hash: [ref.types.void, [
  //   ref.types.CString,
  //   ref.types.uint32,
  //   ref.types.CString,
  // ]],
  doubleHashPassword: [ref.types.void, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    ref.types.CString,
  ]],
  hashPassword: [ref.types.void, [
    ref.types.CString,
    ref.types.CString,
  ]],
  kd_quick: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    uint32_tPtr,
    uint32_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  kd_init: [ref.types.int32, [
  ]],
  kd_create: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  kd_free: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val2Length: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_product: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val1: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val2: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_longVal2: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
  ]],
  kd_calculateHash: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  kd_getHash: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
  ]],
  kd_isValid: [ref.types.int32, [
    ref.types.int32,
  ]],
  nls_init: [nls_t, [
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_init_l: [nls_tPtr, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_free: [ref.types.void, [
    nls_tPtr,
  ]],
  nls_reinit: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_reinit_l: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_create: [ref.types.ulong, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_logon: [ref.types.ulong, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_change_proof: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_S: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_v: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_A: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
  ]],
  nls_get_K: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_M1: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_check_M2: [ref.types.int32, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_check_signature: [ref.types.int32, [
    ref.types.uint32,
    ref.types.CString,
  ]],
  bncsutil_getVersion: [ref.types.ulong, [
  ]],
  bncsutil_getVersionString: [ref.types.int32, [
    ref.types.CString,
  ]],
});

