FROM node:14
WORKDIR /app
ADD . .
RUN npm i -g prisma ts-node
RUN yarn
