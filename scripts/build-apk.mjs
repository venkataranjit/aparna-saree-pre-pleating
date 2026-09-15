import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');

// Parse build mode (default: 'prod')
const args = process.argv.slice(2);
let mode = 'prod';
const modeIdx = args.indexOf('--mode');
if (modeIdx !== -1 && args[modeIdx + 1]) {
  mode = args[modeIdx + 1];
} else if (args.includes('dev') || args.includes('--dev')) {
  mode = 'dev';
} else if (args.includes('prod') || args.includes('--prod')) {
  mode = 'prod';
}

console.log(`\n======================================================`);
console.log(` Starting Android APK Build for [${mode.toUpperCase()}] Environment`);
console.log(` Mode: ${mode}`);
console.log(`======================================================\n`);

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
  // Automatically activate the correct google-services.json (src/dev or src/prod)
  const androidAppDir = path.join(rootDir, 'android', 'app');
  const targetGoogleServices = path.join(androidAppDir, 'google-services.json');
  const sourceGoogleServices = path.join(androidAppDir, 'src', mode, 'google-services.json');

  if (fs.existsSync(sourceGoogleServices)) {
    fs.copyFileSync(sourceGoogleServices, targetGoogleServices);
    console.log(`[Google Services] Active configuration: [${mode.toUpperCase()}] from src/${mode}/google-services.json\n`);
  } else {
    console.warn(`[Google Services] Note: src/${mode}/google-services.json not found, using existing file.\n`);
  }

  // Set App Name: "Aparna Dev" for dev build, "Aparna" for prod build
  const stringsPath = path.join(androidAppDir, 'src', 'main', 'res', 'values', 'strings.xml');
  const appDisplayName = mode === 'dev' ? 'Aparna Dev' : 'Aparna';
  const stringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${appDisplayName}</string>
    <string name="title_activity_main">${appDisplayName}</string>
    <string name="package_name">com.aparnasaree.app</string>
    <string name="custom_url_scheme">com.aparnasaree.app</string>
</resources>
`;
  fs.writeFileSync(stringsPath, stringsXml, 'utf-8');
  console.log(`[App Name] Configured launcher app name as "${appDisplayName}" for [${mode.toUpperCase()}]\n`);

  // Step 0: Completely clean dist and assets to prevent recursive asset bloat
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');
  const androidAssetsPublic = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('[Clean] Wiped dist directory');
  }

  [publicDir, androidAssetsPublic].forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (file.endsWith('.apk')) {
          try {
            fs.unlinkSync(path.join(dir, file));
            console.log(`[Clean] Removed APK from ${path.basename(dir)}: ${file}`);
          } catch (e) {}
        }
      });
    }
  });

  console.log(`--- 1. Building web application for [${mode}] ---`);
  run(`npx vite build --mode ${mode}`);

  console.log('\n--- 2. Syncing Capacitor Android ---');
  run('npx cap sync android');

  console.log('\n--- 3. Compiling Android APK with Gradle ---');
  const targetTask = mode === 'prod' ? 'assembleRelease' : 'assembleDebug';
  const gradleCmd = process.platform === 'win32' ? `.\\gradlew.bat ${targetTask}` : `./gradlew ${targetTask}`;
  run(gradleCmd, androidDir);

  const apkSubFolder = mode === 'prod' ? 'release' : 'debug';
  const apkFileName = mode === 'prod' ? 'app-release.apk' : 'app-debug.apk';
  const srcApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', apkSubFolder, apkFileName);
  const envApk = path.join(rootDir, `aparna-saree-pre-pleating-${mode}.apk`);
  const standardApk = path.join(rootDir, 'aparna-saree-pre-pleating.apk');

  if (fs.existsSync(srcApk)) {
    // Copy to root directory
    fs.copyFileSync(srcApk, envApk);
    fs.copyFileSync(srcApk, standardApk);

    // Also copy to public folder for direct landing page web downloads
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const publicEnvApk = path.join(publicDir, `aparna-saree-pre-pleating-${mode}.apk`);
    const publicStandardApk = path.join(publicDir, 'aparna-saree-pre-pleating.apk');
    fs.copyFileSync(srcApk, publicEnvApk);
    fs.copyFileSync(srcApk, publicStandardApk);

    const stats = fs.statSync(envApk);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n======================================================');
    console.log(` BUILD SUCCESSFUL! [${mode.toUpperCase()}]`);
    console.log(` Root Environment APK:   ${envApk}`);
    console.log(` Root Standard APK:      ${standardApk}`);
    console.log(` Public Environment APK: ${publicEnvApk}`);
    console.log(` Public Standard APK:    ${publicStandardApk}`);
    console.log(` APK Size:               ${sizeMb} MB`);
    console.log('======================================================\n');
  } else {
    console.warn('\nWarning: Build finished but APK was not found at expected location:', srcApk);
  }
} catch (err) {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
}
