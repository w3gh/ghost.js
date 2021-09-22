
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
COPY mapcfgs ./mapcfgs
COPY maps ./maps
COPY src ./src
COPY vendor ./vendor
COPY config.json ./config.json
COPY tsconfig.json ./tsconfig.json
COPY war3 ./war3
#COPY libbncsutil.so ./libbncsutil.so

RUN npm install

RUN uname -a
RUN apt-get install -y libgmp-dev zlib1g-dev libbz2-dev

RUN cd ./vendor/bncsutil/src/bncsutil/ && make
RUN cp ./vendor/bncsutil/src/bncsutil/libbncsutil.so ./libbncsutil.so

RUN cp ./vendor/StormLib/Makefile.linux ./vendor/StormLib/Makefile

RUN cd ./vendor/StormLib/ && make
RUN cp ./vendor/StormLib/libStorm.so ./libstorm.so

#RUN make -f ./bncsutil/build/Makefile
#RUN make -f ./bncsutil/build/Makefile install

EXPOSE 6112:6112/udp
EXPOSE 6113:6113/udp
EXPOSE 6114:6114/udp

CMD ["npm", "start"]
