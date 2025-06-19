import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

// Configuration for tesfun.netlify.app
const config = {
  domain: 'tesfun.netlify.app',
  name: 'Fun Tes',
  description: 'A fun test app',
  buttonText: 'FunT',
  primaryCategory: 'utility',
  tags: ['fun', 'test', 'demo']
};

// Generate manifest without signature (for development)
const metadata = {
  frame: {
    version: "1",
    name: config.name,
    iconUrl: `https://${config.domain}/icon.png`,
    homeUrl: `https://${config.domain}`,
    imageUrl: `https://${config.domain}/api/opengraph-image`,
    buttonTitle: config.buttonText,
    splashImageUrl: `https://${config.domain}/splash.png`,
    splashBackgroundColor: "#f7f7f7",
    webhookUrl: `https://${config.domain}/api/webhook`,
    subtitle: config.description,
    description: config.description,
    primaryCategory: config.primaryCategory,
    tags: config.tags,
    heroImageUrl: `https://${config.domain}/og.png`,
    tagline: config.description,
    ogTitle: config.name,
    ogDescription: config.description,
    ogImageUrl: `https://${config.domain}/og.png`
  },
};

// Update .env file
const envPath = path.join(projectRoot, '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const newEnvVars = [
  `NEXT_PUBLIC_URL=https://${config.domain}`,
  `NEXT_PUBLIC_MINI_APP_NAME="${config.name}"`,
  `NEXT_PUBLIC_MINI_APP_DESCRIPTION="${config.description}"`,
  `NEXT_PUBLIC_MINI_APP_PRIMARY_CATEGORY="${config.primaryCategory}"`,
  `NEXT_PUBLIC_MINI_APP_TAGS="${config.tags.join(',')}"`,
  `NEXT_PUBLIC_MINI_APP_BUTTON_TEXT="${config.buttonText}"`,
  `NEXT_PUBLIC_ANALYTICS_ENABLED="false"`,
  `NEXT_PUBLIC_USE_WALLET="false"`,
  `NEXTAUTH_URL=https://${config.domain}`,
  `MINI_APP_METADATA=${JSON.stringify(metadata)}`,
];

// Update or append each environment variable
newEnvVars.forEach(varLine => {
  const [key] = varLine.split('=');
  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(new RegExp(`${key}=.*`), varLine);
  } else {
    envContent += `\n${varLine}`;
  }
});

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables updated for tesfun.netlify.app');

// Update the manifest file
const manifestPath = path.join(projectRoot, 'public', '.well-known', 'farcaster.json');
fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));

console.log('✅ Manifest updated for tesfun.netlify.app');

// Run next build
console.log('\nBuilding Next.js application...');
const nextBin = path.normalize(path.join(projectRoot, 'node_modules', '.bin', 'next'));
execSync(`"${nextBin}" build`, { 
  cwd: projectRoot, 
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

console.log('\n✨ Build complete! Your mini app is ready for deployment to Netlify. 🪐');
console.log('🔗 Domain: https://tesfun.netlify.app');
console.log('📱 App Name:', config.name);
console.log('🔘 Button Text:', config.buttonText); 