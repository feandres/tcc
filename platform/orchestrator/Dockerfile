FROM node:20-alpine

# Instala o cliente Docker e o plugin do Compose
RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app

COPY package.json ./

RUN npm install --production

COPY src/ ./src/

# Executa como root para ter acesso ao socket /var/run/docker.sock
CMD ["node", "src/index.js"]

