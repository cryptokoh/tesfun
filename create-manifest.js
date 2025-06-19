import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Configuration
const config = {
  domain: 'tesfun.netlify.app',
  name: 'Fun Tes',
  description: 'A fun test app',
  buttonText: 'FunT',
  primaryCategory: 'Utility',
  tags: ['Fun', 'Test'],
  iconUrl: 'https://tesfun.netlify.app/icon.png',
  homeUrl: 'https://tesfun.netlify.app',
  imageUrl: 'https://tesfun.netlify.app/api/opengraph-image',
  splashImageUrl: 'https://tesfun.netlify.app/splash.png',
  splashBackgroundColor: '#f7f7f7',
  webhookUrl: 'https://tesfun.netlify.app/api/webhook'
};

// Generate manifest without signature (for development)
const metadata = {
  frame: {
    version: "1",
    name: config.name,
    iconUrl: config.iconUrl,
    homeUrl: config.homeUrl,
    imageUrl: config.imageUrl,
    buttonTitle: config.buttonText,
    splashImageUrl: config.splashImageUrl,
    splashBackgroundColor: config.splashBackgroundColor,
    webhookUrl: config.webhookUrl,
    description: config.description,
    primaryCategory: config.primaryCategory,
    tags: config.tags,
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

console.log('✅ Manual manifest created successfully!');
console.log('📝 Environment variables updated in .env');
console.log('🔗 Domain:', config.domain);
console.log('📱 App Name:', config.name);
console.log('🔘 Button Text:', config.buttonText);

// Also create a manifest.json file for easy access
const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));
console.log('📄 Manifest saved to public/manifest.json'); 