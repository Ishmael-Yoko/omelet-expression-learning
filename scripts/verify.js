const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function run(command, args, options = {}) {
  const label = [command, ...args].join(' ');
  const executable = process.platform === 'win32' && command === 'npm' ? 'cmd.exe' : command;
  const executableArgs = process.platform === 'win32' && command === 'npm'
    ? ['/d', '/s', '/c', command, ...args]
    : args;
  console.log(`\n> ${label}`);
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error);
    }
    process.exit(result.status || 1);
  }
}

function collectJsFiles(dir, files = []) {
  const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'models']);

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        collectJsFiles(fullPath, files);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(relPath);
    }
  }

  return files;
}

function assertNoBundledModels() {
  const outputDir = path.join(root, 'dist', 'win-unpacked');
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Packaged output missing: ${outputDir}`);
  }

  const forbidden = [];
  const stack = [outputDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'models' || entry.name.startsWith('sherpa-onnx-streaming-')) {
          forbidden.push(fullPath);
        }
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name === 'encoder.int8.onnx') {
        forbidden.push(fullPath);
      }
    }
  }

  if (forbidden.length > 0) {
    throw new Error(`Bundled model files found:\n${forbidden.join('\n')}`);
  }

  console.log('\n> packaged model exclusion check');
  console.log('ok - no external ASR model files were bundled');
}

function cleanDist() {
  const distDir = path.join(root, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
}

run('npm', ['test']);

for (const file of collectJsFiles(root).sort()) {
  run('node', ['--check', file]);
}

run('node', ['-e', "require('./main.js'); setTimeout(() => process.exit(0), 1000)"]);
cleanDist();
run('npm', ['run', 'dist']);
assertNoBundledModels();

console.log('\nverify complete');
