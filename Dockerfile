FROM node:16.18-alpine

# Create and set working directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# Copy source files
COPY . . 

# Install Typescript and ts-node (Run typescript without compiling first) 
RUN npm install -g ts-node typescript '@types/node'

# Install dependencies
RUN npm install

# Build and start app
ENTRYPOINT [ "npm", "run", "start" ]