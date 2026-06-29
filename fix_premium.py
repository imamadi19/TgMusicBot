import sys
with open('/root/bott/src/handlers/premium.js', 'r') as f:
    content = f.read()

bad = """  const { scope, id, days } = parseArgs(ctx);
  if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.grantUsage'));
  const result = await upsertPremium({ scope, scopeId: id, grantedBy: ctx.from.id, days: Number.isFinite(days) ? days : 30 });"""

good = """  const { scope, id, days } = parseArgs(ctx);
  if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.grantUsage'));
  const validDays = Number.isFinite(days) && days > 0 ? days : 30;
  const result = await upsertPremium({ scope, scopeId: id, grantedBy: ctx.from.id, days: validDays });"""

content = content.replace(bad, good)

with open('/root/bott/src/handlers/premium.js', 'w') as f:
    f.write(content)
