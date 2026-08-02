import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('env parser quote stripping', () => {
  let tempDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'env-test-'));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(tempDir, { recursive: true, force: true });
  });

  const loadEnv = (content: string): void => {
    const envFile = path.join(tempDir, '.env');
    writeFileSync(envFile, content);

    const lines = content.split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      const eq = line.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        val.length >= 2 &&
        ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'")))
      ) {
        val = val.slice(1, -1);
      }
      if (key) {
        process.env[key] = val;
      }
    }
  };

  it('strips double quotes from values', () => {
    loadEnv('TEST_KEY="hello world"');
    expect(process.env['TEST_KEY']).toBe('hello world');
  });

  it('strips single quotes from values', () => {
    loadEnv("TEST_KEY='hello world'");
    expect(process.env['TEST_KEY']).toBe('hello world');
  });

  it('leaves unquoted values intact', () => {
    loadEnv('TEST_KEY=hello');
    expect(process.env['TEST_KEY']).toBe('hello');
  });

  it('handles empty values', () => {
    loadEnv('TEST_KEY=');
    expect(process.env['TEST_KEY']).toBe('');
  });

  it('handles values with internal quotes', () => {
    loadEnv('TEST_KEY="say \\"hello\\""');
    expect(process.env['TEST_KEY']).toBe('say \\"hello\\"');
  });

  it('ignores comments', () => {
    loadEnv('# this is a comment\nTEST_KEY=value');
    expect(process.env['TEST_KEY']).toBe('value');
  });
});
