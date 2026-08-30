# ---------- Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Build için tüm dependency'ler
RUN npm install

# Projeyi kopyala
COPY . .

# TypeScript → dist/
RUN npm run build


# ---------- Production ----------
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Sadece production dependency'leri
RUN npm install --omit=dev

# Derlenmiş uygulama
COPY --from=builder /app/dist ./dist

# EJS view'ları
COPY --from=builder /app/src/views ./src/views

# Public dosyaları
COPY --from=builder /app/src/public ./src/public

# Sequelize
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/.sequelizerc ./.sequelizerc

EXPOSE 3000

CMD ["npm", "start"]