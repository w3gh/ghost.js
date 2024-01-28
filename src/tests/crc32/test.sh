#!/usr/bin/env bash

./make.sh
./crc32-bin test_map.w3x
ts-node crc32-js.ts test_map.w3x
