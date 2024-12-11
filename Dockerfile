FROM node:latest

VOLUME /root/.npm

RUN npm install -g cnpm --registry=https://registry.npmmirror.com

RUN apt-get update && \
    apt-get install -y make && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app
WORKDIR /app
