FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && pip3 install --break-system-packages --no-cache-dir yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

RUN groupadd -r app && useradd -r -g app -m -d /home/app app \
    && mkdir -p /app/downloads \
    && chown -R app:app /app /home/app

USER app
ENV NODE_ENV=production
CMD ["npm", "start"]
