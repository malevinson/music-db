// Writes react-ui/build/version.json at build time so the deployed app can serve it at /version.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
};

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const env = process.env;

const info = {
  name: pkg.name,
  version: pkg.version,
  commit: env.COMMIT_REF || git('rev-parse HEAD') || 'local',
  commitMessage: git('log -1 --pretty=%s'),
  commitDate: git('log -1 --pretty=%cI'),
  branch: env.BRANCH || git('rev-parse --abbrev-ref HEAD'),
  context: env.CONTEXT || 'local',
  deployId: env.DEPLOY_ID || null,
  buildTime: new Date().toISOString(),
};

const out = path.resolve('react-ui/build/version.json');
fs.writeFileSync(out, JSON.stringify(info, null, 2) + '\n');
console.log(`Wrote ${out}:`, info);
