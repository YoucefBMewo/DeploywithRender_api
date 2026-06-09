FROM node:26

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm install

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]