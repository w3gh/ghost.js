#!/usr/bin/env bash

./make.sh
cargo build --release

./sha1-bin test_map.w3x
./target/release/sha1 test_map.w3x
ts-node sha1-js.ts test_map.w3x
