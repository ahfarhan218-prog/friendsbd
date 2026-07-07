FROM node:20-slim
RUN apt-get update -y && apt-get install -y ca-certificates && apt-get clean
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 5000
CMD node index.js
