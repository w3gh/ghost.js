import * as fs from "fs";
import * as path from "path";
import {
  load,
  DataType,
  arrayConstructor,
  createPointer,
  restorePointer,
  unwrapPointer,
  freePointer,
  PointerType,
} from "ffi-rs";

const startTime = Date.now();

export function getTime() {
  return Math.floor(Date.now() / 1000);
}

export function getTicks() {
  return Date.now() - startTime;
}

export function getTimezone() {
  return Math.abs(new Date(Date.now()).getTimezoneOffset());
}

export function networkInterfaces() {
  const os = require("os");
  const ifaces = os.networkInterfaces();
  const faces = [];

  Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        faces.push({ name: ifname + ":" + alias, address: iface.address });
        // this single interface has multiple ipv4 addresses
      } else {
        // this interface has only one ipv4 adress
        faces.push({ name: ifname, address: iface.address });
      }
      ++alias;
    });
  });

  return faces;
}

export function localIP() {
  return require("ip").address();
}

export function ipToBuffer(ip: string) {
  return require("ip").toBuffer(ip);
}

export function isNameValid(name) {
  return name.length && name.length <= 15;
}

export function resolveLibraryPath(name: string) {
  const platform = process.platform;
  const cwd = process.cwd();
  let libPath = null;

  if (platform === "win32") {
    libPath = `${name}.dll`;
  } else if (platform === "linux") {
    libPath = `lib${name}.so`;
  } else if (platform === "darwin") {
    libPath = `lib${name}.dylib`;
  } else {
    throw new Error(`unsupported plateform for ${name}`);
  }

  let libName = path.resolve(cwd, libPath);

  if (!fs.existsSync(libName)) {
    console.error(`${libName} not found, fallback to lib${name}`);

    return `lib${name}`;
  }

  return libName;
}

// ffi-rs typings resolve to a Promise under TS 4.0; these calls are synchronous
export const call = load as (params: Parameters<typeof load>[0]) => any;

const bytes = (length: number) =>
  arrayConstructor({ type: DataType.U8Array, length });

// ffi-rs copies Buffer arguments, so C writes into them are lost.
// Out-params need a native buffer: pass `ptr`, then `read()` copies it out and frees it.
export function outPtr(length: number) {
  const paramsType = [bytes(length)];
  const pointer = createPointer({
    paramsType,
    paramsValue: [Buffer.alloc(length)],
  });

  return {
    ptr: unwrapPointer(pointer)[0],
    read(): Buffer {
      const [data] = restorePointer({ retType: paramsType, paramsValue: pointer });
      const copy = Buffer.from(data as number[]);
      freePointer({
        paramsType,
        paramsValue: pointer,
        pointerType: PointerType.RsPointer,
      });
      return copy;
    },
  };
}

