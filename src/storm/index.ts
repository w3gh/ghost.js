import * as ref from "ref-napi";

import Files from "./files";
import { StormLib, HANDLEPtr } from "./storm-lib";

export class MPQ {
  static OPEN = {
    READ_ONLY: 0x00000100,
    WRITE_SHARE: 0x00000200,
    USE_BITMAP: 0x00000400,
    NO_LISTFILE: 0x00010000,
    NO_ATTRIBUTES: 0x00020000,
    NO_HEADER_SEARCH: 0x00040000,
    FORCE_MPQ_V1: 0x00080000,
    CHECK_SECTOR_CRC: 0x00100000,
  };

  static CREATE = {
    LISTFILE: 0x00100000,
    ATTRIBUTES: 0x00200000,
    SIGNATURE: 0x00400000,
    ARCHIVE_V1: 0x00000000,
    ARCHIVE_V2: 0x01000000,
    ARCHIVE_V3: 0x02000000,
    ARCHIVE_V4: 0x03000000,
  };
  private path: any;
  private flags: any;
  public handle: any;
  public files: Files;

  constructor(path, flags, handle) {
    this.path = path;
    this.flags = flags;
    this.handle = handle;
    this.files = new Files(this);
  }

  close() {
    const handle = this.handle;
    if (handle) {
      this.handle = null;
      return StormLib.SFileCloseArchive(handle);
    }
  }

  get opened() {
    return !!this.handle;
  }

  // patch(path, prefix = null) {
  //   if (!(this.flags & MPQ.OPEN.READ_ONLY)) {
  //     throw new Error('archive must be read-only');
  //   }

  //   const flags = 0;
  //   return StormLib.SFileOpenPatchArchive(this.handle, path, prefix, flags);
  // }

  // get patched() {
  //   if (this.handle) {
  //     return StormLib.SFileIsPatchedArchive(this.handle);
  //   }
  // }

  // static get locale() {
  //   return StormLib.SFileGetLocale();
  // }

  // static set locale(locale) {
  //   StormLib.SFileSetLocale(locale);
  // }

  static open(path, flags = 0, callback: (mpq: MPQ) => void) {
    if (typeof flags === "function" && callback === undefined) {
      return MPQ.open(path, null, flags);
    }

    const priority = 0;
    const handlePtr = ref.alloc(HANDLEPtr);
    if (StormLib.SFileOpenArchive(path, priority, flags, handlePtr)) {
      const handle = ref.deref(handlePtr);
      const mpq = new MPQ(path, flags, handle);

      if (callback !== undefined) {
        callback(mpq);
        mpq.close();
        return true;
      }

      return mpq;
    }
    const errno = StormLib.GetLastError();
    throw new Error(`archive could not be found or opened (${errno})`);
  }

  // static create(path, callback) {
  //   const flags = 0;
  //   const maxFileCount = 0;
  //   const handlePtr = ref.alloc(HANDLEPtr);
  //   if (StormLib.SFileCreateArchive(path, flags, maxFileCount, handlePtr)) {
  //     return MPQ.open(path, null, callback);
  //   }
  //   const errno = StormLib.GetLastError();
  //   throw new Error(`archive could not be created (${errno})`);
  // }
}
