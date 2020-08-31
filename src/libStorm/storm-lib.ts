const fs = require('fs');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const Struct = require('ref-struct-napi');
const path = require('path');

const { bool, int32, uint32 } = ref.types;
const string = ref.types.CString;

const voidPtr = ref.refType(ref.types.void);

const FixedString = function (length) {
  return {
    size: length,
    alignment: length,
    indirection: 1,
    name: 'pointer',
    get: function (buffer: Buffer, offset: number) {
      return ref.readCString(buffer, offset);
    },
  };
};

const FIND_DATA = Struct({
  filename:   FixedString(1024),
  name:       string,
  hashIndex:  uint32,
  blockIndex: uint32,
  fileSize:   uint32,
  fileFlags:  uint32,
  compSize:   uint32,
  fileTimeLo: uint32,
  fileTimeHi: uint32,
  locale:     uint32,
});

const HANDLE = voidPtr;
const HANDLEPtr = ref.refType(HANDLE);

const LPDWORD = voidPtr;

const platform = process.platform;
const cwd = process.cwd();
let libPath = null;

if (platform === 'win32'){
  libPath = '/storm.dll';
}else if(platform === 'linux'){
  libPath = '/libstorm.so';
}else if(platform === 'darwin'){
  libPath = '/libstorm.dylib';
}else{
  throw new Error('unsupported plateform for mathlibLoc');
}

let libName = path.resolve(cwd + libPath);

if (!fs.existsSync(libName)) {
  console.error(libName + ' not found, fallback to libstorm');

  libName = 'libstorm';
}

const StormLib = new ffi.Library(libName, {
  SFileGetLocale: [uint32, []],

  SFileSetLocale: [uint32, [
    uint32,
  ]],

  SFileOpenArchive: [bool, [
    string,
    uint32,
    uint32,
    HANDLEPtr,
  ]],

  SFileCreateArchive: [ref.types.char, [
    string,
    uint32,
    uint32,
    HANDLEPtr,
  ]],

  SFileCloseArchive: [bool, [
    HANDLE,
  ]],

  SFileOpenPatchArchive: [bool, [
    HANDLE,
    string,
    string,
    uint32,
  ]],

  SFileIsPatchedArchive: [bool, [
    HANDLE,
  ]],

  SFileHasFile: [bool, [
    HANDLE,
    string,
  ]],

  SFileOpenFileEx: [bool, [
    HANDLE,
    string,
    uint32,
    HANDLEPtr,
  ]],

  SFileGetFileSize: [uint32, [
    HANDLE,
    LPDWORD,
  ]],

  SFileSetFilePointer: [uint32, [
    HANDLE,
    int32,
    int32,
    uint32,
  ]],

  SFileReadFile: [bool, [
    HANDLE,
    voidPtr,
    uint32,
    LPDWORD,
    voidPtr,
  ]],

  SFileCloseFile: [bool, [
    HANDLE,
  ]],

  SFileGetFileName: [bool, [
    HANDLE,
    voidPtr,
  ]],

  SFileExtractFile: [bool, [
    HANDLE,
    string,
    string,
    uint32,
  ]],

  SFileFindFirstFile: [HANDLE, [
    HANDLE,
    string,
    voidPtr,
    string,
  ]],

  SFileFindNextFile: [bool, [
    HANDLE,
    voidPtr,
  ]],

  SFileFindClose: [bool, [
    HANDLE,
  ]],

  GetLastError: [int32, []],
});

export { StormLib, FIND_DATA, HANDLEPtr };
