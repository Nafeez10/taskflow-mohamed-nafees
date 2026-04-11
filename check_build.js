const { spawnSync } = require('child_process');
const fs = require('fs');

const result = spawnSync('npx', ['tsc', '--noEmit'], {
  cwd: __dirname,
  shell: true,
  encoding: 'utf8',
  timeout: 60000,
});

const output = (result.stdout || '') + (result.stderr || '');
fs.writeFileSync('tsc_errors.txt', output || '(no output)');
console.log('exit code:', result.status);
console.log(output || '(no output)');
