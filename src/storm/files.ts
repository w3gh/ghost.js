import * as ref from 'ref-napi';

import File from './file';
import { StormLib, FIND_DATA, HANDLEPtr } from './storm-lib';
import {MPQ} from "./index";

class Files {
  static FROM_MPQ   = 0x00000000;
  static FROM_LOCAL = 0xFFFFFFFF;
  private mpq: MPQ;

  constructor(mpq: MPQ) {
    this.mpq = mpq;
  }

  get handle() {
    return this.mpq.handle;
  }

  contains(file) {
    return !!this.handle && StormLib.SFileHasFile(this.handle, file);
  }

  get(file) {
    if (this.handle) {
      const fileHandlePtr = ref.alloc(HANDLEPtr);
      if (StormLib.SFileOpenFileEx(this.handle, file, Files.FROM_MPQ, fileHandlePtr)) {
        return new File(ref.deref(fileHandlePtr));
      }
    }
    return null;
  }

  extract(file, target) {
    if (!StormLib.SFileExtractFile(this.handle, file, target, Files.FROM_MPQ)) {
      const errno = StormLib.GetLastError();
      throw new Error(`file could not be extracted (${errno})`);
    }
    return true;
  }

  get all() {
    return this.find('*');
  }

  find(pattern) {
    let handle = null;

    const next = () => {
      const data = new FIND_DATA();
      if (!handle) {
        handle = StormLib.SFileFindFirstFile(this.handle, pattern, data.ref(), null);
        if (!handle.isNull()) {
          return data;
        }
      } else {
        if (StormLib.SFileFindNextFile(handle, data.ref())) {
          return data;
        }
      }
    };

    const results = [];
    let data;
    while (data = next()) {
      results.push(data);
    }

    StormLib.SFileFindClose(handle);
    return results;
  }
}

export default Files;
