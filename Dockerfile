FROM node:12.13-alpine
WORKDIR /app
CMD ["sh","-c"," npm install && npm start  "]