import { BNCSUtil } from "./BNCSUtil";
import * as assert from "assert";
import * as path from "path";

assert(BNCSUtil.getVersion(), "1.3.0");

const war3path = path.resolve("./war3/1.28.5/war3.exe");

console.log(war3path);
let { exeInfo, exeVersion, length } = BNCSUtil.getExeInfo(
  war3path,
  BNCSUtil.getPlatform()
);

console.log({
  exeInfo: exeInfo.toString("utf8"),
  exeVersion: exeVersion.toString("utf8"),
  length,
});

console.log({
  exeInfo: exeInfo.toString("utf8"),
  exeVersion: exeVersion.toString("utf8"),
  length,
});
