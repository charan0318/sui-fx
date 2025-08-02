import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Generate a new keypair for testing
const keypair = new Ed25519Keypair();
const privateKey = keypair.getSecretKey();
const address = keypair.getPublicKey().toSuiAddress();

console.log('Generated test keypair:');
console.log('Private Key:', privateKey);
console.log('Address:', address);
console.log('');
console.log('Set this environment variable:');
console.log(`$env:SUI_FAUCET_PRIVATE_KEY="${privateKey}"`);
