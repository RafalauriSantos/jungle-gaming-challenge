// Verifies docs/spec/requirements.md against the tests.
//   pnpm spec:check           check and print a summary
//   pnpm spec:check --write   also regenerate docs/spec/traceability.md
//
// A test proves assertion k of requirement ID by naming "ID#k" in its title.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SPEC = 'docs/spec/requirements.md'
const TRACE = 'docs/spec/traceability.md'
const MILESTONES = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'each']
const KINDS = ['req', 'opt']
const VERIFY = ['test', 'manual', 'audit', 'config']
const STATUS = ['todo', 'part', 'done']
const ID = /^[A-Z][A-Z0-9]*-[A-Za-z0-9]+$/

interface Row {
  id: string
  m: string
  kind: string
  src: string
  text: string
  verify: string
  status: string
  note: string
  accept: number
  covered: Set<number>
  tests: string[]
}
interface Gate {
  id: string
  criterion: string
  provenBy: string[]
}
interface Scenario {
  key: string
  name: string
  open: string[]
}

const errors: string[] = []
const warnings: string[] = []

// --- requirements (8 columns) and disqualifying gates (4 columns)
const rows: Row[] = []
const gates: Gate[] = []
for (const line of readFileSync(SPEC, 'utf8').split('\n')) {
  if (!line.startsWith('|')) continue
  const cells = line.split('|').slice(1, -1).map((c) => c.trim())
  if (!ID.test(cells[0] ?? '')) continue
  const id = cells[0]!
  if (cells.length === 4) {
    gates.push({ id, criterion: cells[1]!, provenBy: cells[2]!.split(',').map((s) => s.trim()).filter(Boolean) })
    continue
  }
  if (cells.length !== 8) {
    errors.push(`${id}: expected 8 columns, found ${cells.length}`)
    continue
  }
  const [, m = '', kind = '', src = '', text = '', verify = '', status = '', note = ''] = cells
  if (!MILESTONES.includes(m)) errors.push(`${id}: bad milestone "${m}"`)
  if (!KINDS.includes(kind)) errors.push(`${id}: bad kind "${kind}"`)
  if (!VERIFY.includes(verify)) errors.push(`${id}: bad verify "${verify}"`)
  if (!STATUS.includes(status)) errors.push(`${id}: bad status "${status}"`)
  if (rows.some((r) => r.id === id)) errors.push(`${id}: duplicated`)
  const accept = text.includes('Accept:') ? text.split('Accept:')[1]!.split(';').map((s) => s.trim()).filter(Boolean) : []
  if (accept.length === 0) errors.push(`${id}: no "Accept:" assertions`)
  rows.push({ id, m, kind, src, text, verify, status, note, accept: accept.length, covered: new Set(), tests: [] })
}
const prefixes = new Set([...rows, ...gates].map((r) => r.id.split('-')[0]!))
const byId = new Map(rows.map((r) => [r.id, r]))

// --- tests
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'node_modules') return []
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
const testFiles = ['e2e', 'src'].flatMap((d) => walk(d)).filter((f) => /\.(spec|test)\.tsx?$/.test(f))
const TITLE = /\b(?:test|it)(?:\.\w+)*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
for (const file of testFiles) {
  for (const [, , title = ''] of readFileSync(file, 'utf8').matchAll(TITLE)) {
    for (const [, token = '', k] of title.matchAll(/\b([A-Z][A-Z0-9]*-[A-Za-z0-9]+)(?:#(\d+))?/g)) {
      if (!prefixes.has(token.split('-')[0]!)) continue
      const row = byId.get(token)
      if (!row) {
        errors.push(`${file}: test mentions unknown requirement ${token}`)
        continue
      }
      row.tests.push(`${file}: ${title}`)
      if (k) {
        if (Number(k) < 1 || Number(k) > row.accept) errors.push(`${file}: ${token}#${k} is outside 1..${row.accept}`)
        else row.covered.add(Number(k))
      }
    }
  }
}

// --- rules
for (const r of rows) {
  if (r.verify === 'test' && r.status === 'done') {
    const missing = [...Array(r.accept).keys()].map((i) => i + 1).filter((k) => !r.covered.has(k))
    if (missing.length) errors.push(`${r.id}: done, but assertions ${missing.join(', ')} have no test (name ${r.id}#k)`)
  }
  if (r.verify === 'test' && r.status === 'todo' && r.tests.length > 0) warnings.push(`${r.id}: has tests but is still todo`)
  if (r.tests.length > 0 && r.covered.size === 0) warnings.push(`${r.id}: tests mention it without #k`)
}
for (const g of gates) for (const p of g.provenBy) if (!byId.has(p)) errors.push(`${g.id}: proven by unknown ${p}`)

// --- Statement section 9: each of the 12 scenarios (Appendix A of design-decisions.md) maps to existing requirements,
// and TEST-1 ("the 12 scenarios pass") can only be done when every requirement they map to is done.
const scenarios: Scenario[] = []
{
  const appendix = readFileSync('docs/spec/design-decisions.md', 'utf8').split('## Appendix A')[1] ?? ''
  const expand = (token: string): string[] => {
    const range = token.match(/^([A-Z][A-Z0-9]*-[A-Z]?)(\d+)\.\.[A-Z]?(\d+)$/)
    if (!range) return [token]
    const [, prefix = '', from = '', to = ''] = range
    return Array.from({ length: Number(to) - Number(from) + 1 }, (_, i) => `${prefix}${String(Number(from) + i).padStart(from.length, '0')}`)
  }
  for (const line of appendix.split('\n')) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length !== 3 || !/^(E\d+|none)$/.test(cells[0]!)) continue
    const ids = cells[2]!.split(',').map((t) => t.trim()).filter(Boolean).flatMap(expand)
    for (const id of ids) if (!byId.has(id)) errors.push(`design-decisions.md Appendix A: ${cells[0]} maps to unknown ${id}`)
    scenarios.push({ key: cells[0]!, name: cells[1]!, open: ids.filter((id) => byId.get(id) && byId.get(id)!.status !== 'done') })
  }
  const test1 = byId.get('TEST-1')
  if (test1?.status === 'done') for (const sc of scenarios.filter((x) => x.open.length)) errors.push(`TEST-1 is done, but scenario ${sc.key} still has open requirements: ${sc.open.join(', ')}`)
}

// --- README: the scenario table must list every MOCK-S requirement and every scenario the mock can run (DEL-3)
{
  let readme = ''
  try {
    readme = readFileSync('README.md', 'utf8')
  } catch {
    errors.push('README.md is missing (DEL-3)')
  }
  if (readme) {
    const table = readme.split('<!-- scenarios:start -->')[1]?.split('<!-- scenarios:end -->')[0]
    if (table === undefined) errors.push('README.md has no scenario table between <!-- scenarios:start --> and <!-- scenarios:end -->')
    else {
      for (const r of rows.filter((r) => /^MOCK-S\d+$/.test(r.id))) {
        if (!table.includes(`\`${r.id}\``)) errors.push(`README.md: scenario table does not list ${r.id}`)
      }
      const names = [...readFileSync('src/mocks/scenarios.ts', 'utf8').matchAll(/name: '([a-z0-9-]+)'/g)].map((m) => m[1]!)
      for (const name of names) {
        if (!table.includes(`?scenario=${name}\``)) errors.push(`README.md: scenario table does not list ?scenario=${name}`)
      }
    }
  }
}

// --- report
console.log(`Requirements: ${rows.length} (${rows.filter((r) => r.kind === 'req').length} required), tests: ${testFiles.length} file(s)`)
for (const m of MILESTONES) {
  const inM = rows.filter((r) => r.m === m)
  if (!inM.length) continue
  const n = (s: string) => inM.filter((r) => r.status === s).length
  console.log(`  ${m.padEnd(4)} ${String(inM.length).padStart(3)}  done ${n('done')}, part ${n('part')}, todo ${n('todo')}`)
}
for (const g of gates) {
  const done = g.provenBy.filter((p) => byId.get(p)?.status === 'done').length
  console.log(`  gate ${g.id}: ${done === g.provenBy.length ? 'closed' : 'OPEN'} (${done}/${g.provenBy.length} proofs done)`)
}
{
  const open = scenarios.filter((x) => x.open.length)
  console.log(`  statement section 9: ${scenarios.length - open.length}/${scenarios.length} scenarios fully done`)
  for (const sc of open) console.log(`    ${sc.key} ${sc.name}: open ${sc.open.join(', ')}`)
}
for (const w of warnings) console.warn(`warning: ${w}`)
for (const e of errors) console.error(`error: ${e}`)

if (process.argv.includes('--write')) {
  const body = rows
    .map((r) => `| ${r.id} | ${r.m} | ${r.kind} | ${r.status} | ${r.covered.size}/${r.accept} | ${r.tests.map((t) => t.replace(/\|/g, '/')).join('<br>')} |`)
    .join('\n')
  writeFileSync(
    TRACE,
    `# Traceability\n\nGenerated by \`pnpm spec:check --write\`. Do not edit by hand. "Assertions" is covered/total.\n\n| ID | M | Kind | Status | Assertions | Tests |\n| --- | --- | --- | --- | --- | --- |\n${body}\n`,
  )
}
process.exit(errors.length ? 1 : 0)
