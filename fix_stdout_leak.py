import sys
with open('/root/bott/src/core/player/player.js', 'r') as f:
    content = f.read()

bad = """    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stdout); });
    child.stderr.on('data', (chunk) => { stderr += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stderr); });"""

good = """    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { 
      stdout += chunk; 
      if (stdout.length > 5000) stdout = stdout.slice(-5000);
      logAdapterOutput(`[voice:${chatId}]`, chunk, process.stdout); 
    });
    child.stderr.on('data', (chunk) => { 
      stderr += chunk; 
      if (stderr.length > 5000) stderr = stderr.slice(-5000);
      logAdapterOutput(`[voice:${chatId}]`, chunk, process.stderr); 
    });"""

content = content.replace(bad, good)

with open('/root/bott/src/core/player/player.js', 'w') as f:
    f.write(content)
