import sys
with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'r') as f:
    content = f.read()

# Make sure we add stopAllLyrics
new_func = """
export function stopAllLyrics() {
  for (const [key, runner] of activeRunners.entries()) {
    if (runner.timer) clearInterval(runner.timer);
    activeRunners.delete(key);
  }
}
"""

if "export function stopAllLyrics" not in content:
    content += new_func

with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'w') as f:
    f.write(content)
