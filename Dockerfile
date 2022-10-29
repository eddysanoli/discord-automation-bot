FROM node:16.18-alpine

# Create and set working directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# Copy source files
COPY . . 

# Install dependencies
RUN npm install

# Install typescript globally
RUN npm install -g ts-node typescript '@types/node'

# Build and start app
ENTRYPOINT [ "npm", "rum", "start" ]