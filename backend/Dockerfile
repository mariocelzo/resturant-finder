# Usa Node.js 18 Alpine per un'immagine leggera
FROM node:18-alpine

# Metadata
LABEL maintainer="NearBite Team"
LABEL description="Backend proxy per NearBite - protegge API keys"

# Crea directory app
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa dipendenze (solo production)
RUN npm ci --only=production

# Copia il codice sorgente
COPY src/ ./src/

# Espone porta 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Avvia server
CMD ["npm", "start"]
