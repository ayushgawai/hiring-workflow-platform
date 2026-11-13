FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || true
COPY . .
EXPOSE 3001
CMD ["node","apps/api/dist/apps/api/src/main.js"]
