# Use Node.js version 14
FROM node:16 as base

# Create app directory
WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json /home/node/app

RUN npm install

# Bundle app source
COPY . .

EXPOSE 4000

ENV NODE_PATH=./build

ENV POSTGRES_URL=$POSTGRES_URL

# Copy environment variables into the build
COPY .env .env

RUN npm run build

CMD ["node", "build/app.js"]
