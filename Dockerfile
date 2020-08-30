
FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
COPY mapcfgs ./mapcfgs
COPY maps ./maps
COPY src ./src
COPY bncsutil ./bncsutil
COPY StormLib ./StormLib
COPY config.json ./config.json
COPY tsconfig.json ./tsconfig.json
COPY war3 ./war3
#COPY libbncsutil.so ./libbncsutil.so

RUN npm install

RUN uname -a
RUN apt-get install -y libgmp-dev zlib1g-dev libbz2-dev

RUN cd ./bncsutil/src/bncsutil/ && make
RUN cp ./bncsutil/src/bncsutil/libbncsutil.so ./libbncsutil.so

RUN cp ./StormLib/Makefile.linux ./StormLib/Makefile

RUN cd ./StormLib/ && make
RUN cp ./StormLib/libStorm.so ./libstorm.so

#RUN make -f ./bncsutil/build/Makefile
#RUN make -f ./bncsutil/build/Makefile install

EXPOSE 6112
EXPOSE 6113
EXPOSE 6114

CMD ["npm", "start"]
