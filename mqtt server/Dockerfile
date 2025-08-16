FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV production

COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["node", "app.js"]