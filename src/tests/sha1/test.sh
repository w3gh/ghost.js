#!/usr/bin/env bash

./sha1-bin test_map.w3x
ts-node sha1-js.ts test_map.w3x