#!/usr/bin/env bash

cd ./bncsutil || exit
rm -rf build
mkdir build
cmake -G "Unix Makefiles" -B./build -H./
cd build && make && make install
