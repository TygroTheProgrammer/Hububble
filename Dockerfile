FROM node:14-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all the source code into the container
COPY . .

EXPOSE 8080

CMD ["npm", "start"]
