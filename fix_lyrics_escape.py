import sys
with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'r') as f:
    content = f.read()

bad = """export function htmlEscape(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}"""

content = content.replace(bad, "")

# Now add the import
import_line = "import { validateLyricsMatch } from './match-validator.js';"
new_import = import_line + "\\nimport { htmlEscape } from '../../utils/telegram.js';"
content = content.replace(import_line, new_import)

with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'w') as f:
    f.write(content)
