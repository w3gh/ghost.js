import { resolveLibraryPath } from "../util";

import { DataType, open, load } from "ffi-rs";

// const FFI = require("ffi-rs");
const ref = require("ref-napi");
const Struct = require("ref-struct-napi");

const { bool, int32, uint32 } = ref.types;
const string = ref.types.CString;

const voidPtr = ref.refType(ref.types.void);

const FixedString = function (length) {
  return {
    size: length,
    alignment: length,
    indirection: 1,
    name: "pointer",
    get: function (buffer: Buffer, offset: number) {
      return ref.readCString(buffer, offset);
    },
  };
};

const FIND_DATA = Struct({
  filename: FixedString(1024),
  name: string,
  hashIndex: uint32,
  blockIndex: uint32,
  fileSize: uint32,
  fileFlags: uint32,
  compSize: uint32,
  fileTimeLo: uint32,
  fileTimeHi: uint32,
  locale: uint32,
});

const HANDLE = voidPtr;
const HANDLEPtr = ref.refType(HANDLE);

const LPDWORD = voidPtr;

open({
  library: "libstorm",
  path: resolveLibraryPath("storm"),
});

const StormLib = {
  SFileOpenArchive(path, priority, flags, handlePtr) {
    return load({
      library: "libstorm",
      funcName: "SFileOpenArchive",
      retType: DataType.Boolean,
      paramsType: [
        DataType.String,
        DataType.I32,
        DataType.I32,
        DataType.U8Array,
        // {
        //   filename: DataType.String,
        //   name: DataType.String,
        //   hashIndex: DataType.I32,
        //   blockIndex: DataType.I32,
        //   fileSize: DataType.I32,
        //   fileFlags: DataType.I32,
        //   compSize: DataType.I32,
        //   fileTimeLo: DataType.I32,
        //   fileTimeHi: DataType.I32,
        //   locale: DataType.I32,
        // },
      ], // path, priority, flags, handlePtr
      paramsValue: [path, priority, flags, handlePtr],
    });
  },

  SFileCloseArchive(handle) {
    return load({
      library: "libstorm",
      funcName: "SFileCloseArchive",
      retType: DataType.Boolean,
      paramsType: [DataType.U8Array],
      paramsValue: [handle],
    });
  },

  GetLastError() {
    return load({
      library: "libstorm",
      funcName: "GetLastError",
      retType: DataType.I32,
      paramsType: [],
      paramsValue: [],
    });
  },

  SFileHasFile(handle, file) {
    return load({
      library: "libstorm",
      funcName: "SFileHasFile",
      retType: DataType.Boolean,
      paramsType: [DataType.U8Array, DataType.String],
      paramsValue: [handle, file],
    });
  },

  SFileExtractFile(handle, file: string, target: string, fromMPQ) {
    return load({
      library: "libstorm",
      funcName: "SFileExtractFile",
      retType: DataType.Boolean,
      paramsType: [
        DataType.U8Array,
        DataType.String,
        DataType.String,
        DataType.I32,
      ],
      paramsValue: [handle, file, target, fromMPQ],
    });
  },

  SFileOpenFileEx() {},

  SFileFindFirstFile() {},

  SFileFindNextFile() {},

  SFileFindClose() {},

  SFileCloseFile() {},

  SFileGetFileName() {},

  SFileGetFileSize() {},

  SFileReadFile() {},

  SFileSetFilePointer() {},
};

// const StormLib2 = new ffi.Library(resolveLibraryPath("storm"), {
//   SFileGetLocale: [uint32, []],

//   SFileSetLocale: [uint32, [uint32]],

//   SFileOpenArchive: [bool, [string, uint32, uint32, HANDLEPtr]],

//   SFileCreateArchive: [ref.types.char, [string, uint32, uint32, HANDLEPtr]],

//   SFileCloseArchive: [bool, [HANDLE]],

//   SFileOpenPatchArchive: [bool, [HANDLE, string, string, uint32]],

//   SFileIsPatchedArchive: [bool, [HANDLE]],

//   SFileHasFile: [bool, [HANDLE, string]],

//   SFileOpenFileEx: [bool, [HANDLE, string, uint32, HANDLEPtr]],

//   SFileGetFileSize: [uint32, [HANDLE, LPDWORD]],

//   SFileSetFilePointer: [uint32, [HANDLE, int32, int32, uint32]],

//   SFileReadFile: [bool, [HANDLE, voidPtr, uint32, LPDWORD, voidPtr]],

//   SFileCloseFile: [bool, [HANDLE]],

//   SFileGetFileName: [bool, [HANDLE, voidPtr]],

//   SFileExtractFile: [bool, [HANDLE, string, string, uint32]],

//   SFileFindFirstFile: [HANDLE, [HANDLE, string, voidPtr, string]],

//   SFileFindNextFile: [bool, [HANDLE, voidPtr]],

//   SFileFindClose: [bool, [HANDLE]],

//   GetLastError: [int32, []],
// });

export { StormLib, FIND_DATA, HANDLEPtr };
