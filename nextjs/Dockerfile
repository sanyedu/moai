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

# Build the Next.js application
RUN npm run build

# Expose the Next.js port
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
