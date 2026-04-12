# ── Aşama 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları kur
COPY package*.json ./
RUN npm ci

# Kaynak kodları kopyala
COPY . .

# Vite build
RUN npm run build

# ── Aşama 2: Serve (nginx) ───────────────────────────────────
FROM nginx:alpine

# Nginx yapılandırması
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]