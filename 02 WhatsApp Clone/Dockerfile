FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

RUN ./node_modules/.bin/prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]