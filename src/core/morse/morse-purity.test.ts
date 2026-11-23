import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Validates: Requirement 1.5
// Core Morse code has no UI or browser code, and no `any`.

export interface PurityRule {
  readonly name: string
  readonly pattern: RegExp
}

export interface PurityViolation {
  readonly file: string
  readonly rule: string
  readonly pattern: string
}

export const PURITY_RULES: readonly PurityRule[] = [
  { name: 'no window', pattern: /\bwindow\b/ },
  { name: 'no document', pattern: /\bdocument\b/ },
  { name: 'no localStorage', pattern: /\blocalStorage\b/ },
  { name: 'no fetch', pattern: /\bfetch\b/ },
  { name: 'no React import', pattern: /\bfrom\s+['"]react(?:-dom)?(?:\/[^'"]*)?['"]/ },
  { name: 'no any (annotation)', pattern: /:\s*any\b/ },
  { name: 'no any (cast)', pattern: /\bas\s+any\b/ },
  { name: 'no any (generic)', pattern: /<any>/ },
]

export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

/** Scans one source text and returns a violation for every rule that matches. */
export function scanSource(file: string, source: string): PurityViolation[] {
  const code = stripComments(source)
  return PURITY_RULES.filter((rule) => rule.pattern.test(code)).map((rule) => ({
    file,
    rule: rule.name,
    pattern: String(rule.pattern),
  }))
}

const MORSE_DIR = fileURLToPath(new URL('.', import.meta.url))

export function listSourceFiles(dir: string = MORSE_DIR): string[] {
  return readdirSync(dir)
    .filter(
      (name) =>
        name.endsWith('.ts') &&
        !name.endsWith('.test.ts') &&
        name !== 'morse-test-arbitraries.ts',
    )
    .sort()
}

export function scanFolder(dir: string = MORSE_DIR): PurityViolation[] {
  return listSourceFiles(dir).flatMap((name) =>
    scanSource(name, readFileSync(join(dir, name), 'utf8')),
  )
}

describe('morse core purity (requirement 1.5)', () => {
  it('finds source files to scan', () => {
    expect(listSourceFiles().length).toBeGreaterThan(0)
  })

  for (const name of listSourceFiles()) {
    it(`${name} has no browser, React, or any usage`, () => {
      const violations = scanSource(name, readFileSync(join(MORSE_DIR, name), 'utf8'))
      const message = violations
        .map((v) => `${v.file}: ${v.rule} matched ${v.pattern}`)
        .join('\n')
      expect(violations, message).toEqual([])
    })
  }
})

describe('purity scanner self-checks (requirement 1.5)', () => {
  const rulesOf = (source: string): string[] =>
    scanSource('inline.ts', source).map((v) => v.rule)

  it('ignores the word document in a line comment', () => {
    expect(rulesOf('// document\nconst a = 1')).toEqual([])
  })

  it('ignores the word document in a block comment', () => {
    expect(rulesOf('/* document */\nconst a = 1')).toEqual([])
  })

  it('flags the word document in code', () => {
    expect(rulesOf('const a = document')).toEqual(['no document'])
  })

  it('does not trigger on documentation or windowSize', () => {
    expect(rulesOf('const documentation = 1\nconst windowSize = 2')).toEqual([])
  })

  it('flags an any annotation', () => {
    expect(rulesOf('const a: any = 1')).toContain('no any (annotation)')
  })

  it('flags an any cast', () => {
    expect(rulesOf('const a = b as any')).toContain('no any (cast)')
  })

  it('flags an any generic', () => {
    expect(rulesOf('const a = <any>b')).toContain('no any (generic)')
  })
})
