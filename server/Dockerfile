FROM node:10-alpine

WORKDIR /app

COPY ./app/package.json /app/
RUN npm install

COPY ./app/ /app/

EXPOSE 5000

CMD ["npm", "start"]