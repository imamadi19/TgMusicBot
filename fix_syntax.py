import sys
with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'r') as f:
    content = f.read()

# Replace the literal '\n' text with actual newline
content = content.replace("import { validateLyricsMatch } from './match-validator.js';\\nimport { htmlEscape } from '../../utils/telegram.js';", "import { validateLyricsMatch } from './match-validator.js';\nimport { htmlEscape } from '../../utils/telegram.js';")

with open('/root/bott/src/core/lyrics/lyrics-runner.js', 'w') as f:
    f.write(content)
