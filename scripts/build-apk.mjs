import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');

// Ensure JDK 21 is used if available on Windows
const adoptiumJdk21 = 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot';
if (process.platform === 'win32' && fs.existsSync(adoptiumJdk21)) {
  if (!process.env.JAVA_HOME || !process.env.JAVA_HOME.includes('21')) {
    process.env.JAVA_HOME = adoptiumJdk21;
    process.env.PATH = `${path.join(adoptiumJdk21, 'bin')}${path.delimiter}${process.env.PATH}`;
  }
}

function run(cmd, cwd = rootDir) {
  console.log(`\n> Running: ${cmd} (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

try {
  console.log('--- 1. Building web application ---');
  run('npm run build');

  console.log('\n--- 2. Syncing Capacitor Android ---');
  run('npx cap sync android');

  console.log('\n--- 3. Compiling Android APK with Gradle ---');
  const gradleCmd = process.platform === 'win32' ? '.\\gradlew.bat assembleDebug' : './gradlew assembleDebug';
  run(gradleCmd, androidDir);

  const srcApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const destApk = path.join(rootDir, 'aparna-saree-pre-pleating.apk');

  if (fs.existsSync(srcApk)) {
    fs.copyFileSync(srcApk, destApk);
    const stats = fs.statSync(destApk);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n=============================================');
    console.log(' BUILD SUCCESSFUL!');
    console.log(` APK Location: ${destApk}`);
    console.log(` APK Size: ${sizeMb} MB`);
    console.log('=============================================\n');
  } else {
    console.warn('\nWarning: Build finished but APK was not found at expected location:', srcApk);
  }
} catch (err) {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
}
