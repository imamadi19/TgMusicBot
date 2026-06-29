import sys
with open('/root/bott/scripts/pytgcalls_adapter.py', 'r') as f:
    content = f.read()

content = content.replace("raise SystemExit(main())", "os._exit(main())")
content = content.replace("raise SystemExit(1)", "os._exit(1)")

with open('/root/bott/scripts/pytgcalls_adapter.py', 'w') as f:
    f.write(content)
