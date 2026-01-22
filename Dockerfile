
FROM node:22-slim AS base
# Debian-based image has better Prisma compatibility than Alpine
# Install OpenSSL which Prisma needs
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./

FROM base AS test
COPY prisma ./prisma/
RUN npm ci 
COPY . .
EXPOSE 3000
CMD ["npm", "start"]


FROM base AS production
COPY prisma ./prisma/
RUN npm ci --only=production
COPY . .
EXPOSE 3000

#start the application
CMD ["npm", "start"]