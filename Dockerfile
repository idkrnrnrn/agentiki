FROM node:25-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
COPY tsconfig.json ./

EXPOSE 3000

CMD ["node", "--env-file-if-exists=.env", "--experimental-transform-types", "src/server.ts"]
