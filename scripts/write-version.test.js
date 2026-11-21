import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT = path.resolve('scripts/write-version.js');

// Run the script in a throwaway project folder (not a git repo) and return the JSON it wrote.
const runIn = (env = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'write-version-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'playlist-q', version: '9.9.9' }));
  fs.mkdirSync(path.join(dir, 'react-ui/build'), { recursive: true });
  const cleanEnv = { PATH: process.env.PATH, GIT_CEILING_DIRECTORIES: os.tmpdir(), ...env };
  execFileSync(process.execPath, [SCRIPT], { cwd: dir, env: cleanEnv, stdio: 'pipe' });
  const out = JSON.parse(fs.readFileSync(path.join(dir, 'react-ui/build/version.json'), 'utf8'));
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
};

describe('scripts/write-version.js', () => {
  it('records Netlify build info', () => {
    const info = runIn({ COMMIT_REF: 'abc123', BRANCH: 'main', CONTEXT: 'production', DEPLOY_ID: 'd-1' });
    expect(info).toMatchObject({
      name: 'playlist-q',
      version: '9.9.9',
      commit: 'abc123',
      branch: 'main',
      context: 'production',
      deployId: 'd-1',
    });
    expect(new Date(info.buildTime).toString()).not.toBe('Invalid Date');
  });

  it('falls back to safe defaults outside Netlify and outside git', () => {
    const info = runIn();
    expect(info).toMatchObject({
      commit: 'local',
      commitMessage: null,
      commitDate: null,
      branch: null,
      context: 'local',
      deployId: null,
    });
  });
});
