# Build native libs (bncsutil, StormLib) and node_modules
FROM node:24-bookworm AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends cmake libgmp-dev zlib1g-dev libbz2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY vendor/bncsutil ./vendor/bncsutil
COPY vendor/StormLib ./vendor/StormLib

RUN cmake -S vendor/bncsutil -B /tmp/bncsutil -DCMAKE_BUILD_TYPE=Release \
  && cmake --build /tmp/bncsutil -j"$(nproc)" --target bncsutil \
  && cp -L /tmp/bncsutil/libbncsutil.so ./libbncsutil.so

# X* allocator macros map libtomcrypt to libc directly; the bundled LibTom* wrappers
# are used without prototypes and would truncate 64-bit pointers.
RUN cmake -S vendor/StormLib -B /tmp/storm -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON -DUSE_WITH_CASC=OFF \
    -DCMAKE_C_FLAGS="-DXMALLOC=malloc -DXREALLOC=realloc -DXCALLOC=calloc -DXFREE=free" \
  && cmake --build /tmp/storm -j"$(nproc)" --target storm \
  && cp -L /tmp/storm/libstorm.so ./libstorm.so

COPY package*.json ./
RUN npm ci --engine-strict=false


FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends libgmp10 zlib1g libbz2-1.0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/libbncsutil.so /usr/src/app/libstorm.so ./
COPY package*.json tsconfig.json ./
COPY src ./src
COPY mapcfgs ./mapcfgs
COPY maps ./maps
COPY war3 ./war3

# config.json holds account credentials: mount it, don't bake it into the image
# docker run -v $PWD/config.json:/usr/src/app/config.json ...
EXPOSE 6112/tcp 6112/udp

CMD ["npm", "start"]
