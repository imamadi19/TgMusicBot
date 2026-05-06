FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r /tmp/requirements.txt \
    && pip3 install --break-system-packages --no-cache-dir --force-reinstall pyrogrammod tgcrypto \
    && rm -f /tmp/requirements.txt \
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
