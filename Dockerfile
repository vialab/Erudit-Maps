FROM node

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

EXPOSE 3000

CMD ["npm","start"]
