#!/usr/bin/env bash

cd ./vendor/bncsutil || exit
rm -rf build
mkdir build
cmake -G "Unix Makefiles" -B./build -H./
cd build && make && make install
