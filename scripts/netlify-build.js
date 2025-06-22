import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { mnemonicToAccount } from 'viem/accounts';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl) {
  const header = {
    type: 'custody',
    key: accountAddress,
    fid,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

  const payload = {
    domain
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

  const account = mnemonicToAccount(seedPhrase);
  const signature = await account.signMessage({ 
    message: `${encodedHeader}.${encodedPayload}`
  });
  const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

  const tags = process.env.NEXT_PUBLIC_MINI_APP_TAGS?.split(',');

  return {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_MINI_APP_NAME || "Fun Tes",
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/api/opengraph-image`,
      buttonTitle: process.env.NEXT_PUBLIC_MINI_APP_BUTTON_TEXT || "Launch Mini App",
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl,
      description: process.env.NEXT_PUBLIC_MINI_APP_DESCRIPTION || "A fun mini app",
      primaryCategory: process.env.NEXT_PUBLIC_MINI_APP_PRIMARY_CATEGORY || "games",
      tags,
    },
  };
}

async function main() {
  try {
    console.log('\n📝 Building for Netlify...');
    
    // Use environment variables for domain and other settings
    const domain = process.env.NETLIFY_DOMAIN || 'tesfun.netlify.app';
    const seedPhrase = process.env.SEED_PHRASE;
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    const neynarClientId = process.env.NEYNAR_CLIENT_ID;
    
    if (!seedPhrase) {
      console.log('⚠️  No SEED_PHRASE found in environment variables. Skipping manifest generation.');
    } else {
      console.log('✅ Found seed phrase, generating manifest...');
      
      // Generate account address from seed phrase
      const accountAddress = mnemonicToAccount(seedPhrase).address;
      console.log('✅ Generated account address from seed phrase');

      // Use a default FID for now (this could be enhanced later)
      const fid = process.env.FID || 1;

      // Determine webhook URL
      const webhookUrl = neynarApiKey && neynarClientId 
        ? `https://api.neynar.com/f/app/${neynarClientId}/event`
        : `${domain}/api/webhook`;

      // Generate and sign manifest
      console.log('\n🔨 Generating mini app manifest...');
      const metadata = await generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl);
      console.log('\n✅ Mini app manifest generated and signed');

      // Read existing .env file or create new one
      const envPath = path.join(projectRoot, '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

      // Add or update environment variables
      const newEnvVars = [
        // Base URL
        `NEXT_PUBLIC_URL=https://${domain}`,

        // Mini app metadata
        `NEXT_PUBLIC_MINI_APP_NAME="${process.env.NEXT_PUBLIC_MINI_APP_NAME || 'Fun Tes'}"`,
        `NEXT_PUBLIC_MINI_APP_DESCRIPTION="${process.env.NEXT_PUBLIC_MINI_APP_DESCRIPTION || 'A fun mini app'}"`,
        `NEXT_PUBLIC_MINI_APP_PRIMARY_CATEGORY="${process.env.NEXT_PUBLIC_MINI_APP_PRIMARY_CATEGORY || 'games'}"`,
        `NEXT_PUBLIC_MINI_APP_TAGS="${process.env.NEXT_PUBLIC_MINI_APP_TAGS || ''}"`,
        `NEXT_PUBLIC_MINI_APP_BUTTON_TEXT="${process.env.NEXT_PUBLIC_MINI_APP_BUTTON_TEXT || 'Launch Mini App'}"`,

        // Analytics
        `NEXT_PUBLIC_ANALYTICS_ENABLED="${process.env.NEXT_PUBLIC_ANALYTICS_ENABLED || 'false'}"`,

        // Neynar configuration
        ...(neynarApiKey ? [`NEYNAR_API_KEY="${neynarApiKey}"`] : []),
        ...(neynarClientId ? [`NEYNAR_CLIENT_ID="${neynarClientId}"`] : []),

        // FID
        `FID="${fid}"`,
        `NEXT_PUBLIC_USE_WALLET="${process.env.NEXT_PUBLIC_USE_WALLET || 'false'}"`,

        // NextAuth configuration
        `NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || crypto.randomBytes(32).toString('hex')}"`,
        `NEXTAUTH_URL="https://${domain}"`,

        // Mini app manifest with signature
        `MINI_APP_METADATA=${JSON.stringify(metadata)}`,
      ];

      // Filter out empty values and join with newlines
      const validEnvVars = newEnvVars.filter(line => {
        const [, value] = line.split('=');
        return value && value !== '""';
      });

      // Update or append each environment variable
      validEnvVars.forEach(varLine => {
        const [key] = varLine.split('=');
        if (envContent.includes(`${key}=`)) {
          envContent = envContent.replace(new RegExp(`${key}=.*`), varLine);
        } else {
          envContent += `\n${varLine}`;
        }
      });

      // Write updated .env file
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Environment variables updated');

      // Also output a static farcaster.json manifest
      const manifestPath = path.join(projectRoot, 'public', '.well-known', 'farcaster.json');
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));
      console.log('✅ Manifest written to', manifestPath);
    }

    // Run next build
    console.log('\nBuilding Next.js application...');
    const nextBin = path.normalize(path.join(projectRoot, 'node_modules', '.bin', 'next'));
    execSync(`"${nextBin}" build`, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    console.log('\n✨ Build complete! Your mini app is ready for deployment. 🪐');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main(); 