import sys
with open('/root/bott/src/core/player/player.js', 'r') as f:
    content = f.read()

bad = """      const timer = setTimeout(() => {
        signalProcess(child, 'SIGTERM');
        reject(new Error('Assistant timeout saat join obrolan video. Pastikan obrolan video aktif dan assistant sudah ada di grup.'));
      }, START_TIMEOUT_MS);"""

good = """      const timer = setTimeout(() => {
        signalProcess(child, 'SIGTERM');
        setTimeout(() => signalProcess(child, 'SIGKILL'), 3000).unref?.();
        reject(new Error('Assistant timeout saat join obrolan video. Pastikan obrolan video aktif dan assistant sudah ada di grup.'));
      }, START_TIMEOUT_MS);"""

content = content.replace(bad, good)

with open('/root/bott/src/core/player/player.js', 'w') as f:
    f.write(content)
