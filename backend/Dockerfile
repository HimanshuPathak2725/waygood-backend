FROM node:20-alpine

WORKDIR /app

# Install deps first so this layer is cached unless package*.json changes.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/server.js"]
