# Use the Node.js image
FROM node:22

RUN npm config set registry https://registry.npmmirror.com

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# build 
RUN npm run build

# Expose the WebSocket port
EXPOSE 8080

# Run the WebSocket server
CMD ["npm", "start"]
