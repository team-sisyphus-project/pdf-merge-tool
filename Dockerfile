FROM node:22.14.0-alpine3.21 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22.14.0-alpine3.21 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

USER node
CMD ["sh", "-c", "exec ./node_modules/.bin/serve --no-clipboard -s dist -l tcp://0.0.0.0:${PORT}"]
