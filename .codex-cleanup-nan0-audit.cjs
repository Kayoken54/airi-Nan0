const { existsSync, rmSync } = require('node:fs')
const { basename, resolve } = require('node:path')

const expected = 'H:\\Nan0_Airi_Source\\.codex-temp-nan0-evidence-profile-20260718'
const target = resolve(expected)
if (target !== expected || basename(target) !== '.codex-temp-nan0-evidence-profile-20260718')
  throw new Error('Refusing unsafe audit-profile cleanup target.')
if (existsSync(target))
  rmSync(target, { recursive: true, force: false })
console.log(JSON.stringify({ removed: !existsSync(target) }))
