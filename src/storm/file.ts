import * as ref from 'ref-napi';
import { StormLib } from './storm-lib';

class File {
  static FILE_BEGIN   = 0;
  static FILE_CURRENT = 1;
  static FILE_END     = 2;

  static MAX_PATH = 260;
  private handle: any;

  constructor(handle) {
    this.handle = handle;
  }

  close() {
    const handle = this.handle;
    if (handle) {
      this.handle = null;
      return StormLib.SFileCloseFile(handle);
    }
  }

  get opened() {
    return !!this.handle;
  }

  get name() {
    if (this.handle) {
      const name = Buffer.alloc(File.MAX_PATH);
      if (!StormLib.SFileGetFileName(this.handle, name)) {
        return null;
      }

      return ref.readCString(name, 0);
    }
  }

  get size() {
    return this.handle && StormLib.SFileGetFileSize(this.handle, null);
  }

  get data() {
    if (this.handle) {
      // const data = new Buffer(this.size);
      const data = Buffer.alloc(this.size);
      this.position = 0;
      if (!StormLib.SFileReadFile(this.handle, data, this.size, null, null)) {
        return null;
      }
      return data;
    }
  }

  set position(offset) {
    StormLib.SFileSetFilePointer(this.handle, offset, null, File.FILE_BEGIN);
  }
}

export default File;
