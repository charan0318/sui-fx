# Repository Name Change: sui-faucet-core → sui-fx

## ✅ Updated Files

### Package Configuration
- ✅ `package.json` - Main repo name and description
- ✅ `packages/backend/package.json` - Backend package name
- ✅ `packages/discord-bot/package.json` - Discord bot package name

### Documentation
- ✅ `README.md` - Title and project structure references
- ✅ `docs/DEPLOYMENT_GUIDE.md` - Clone instructions
- ✅ `guide/DEPLOYMENT_GUIDE.md` - Clone instructions  
- ✅ `docs/GITHUB_SECRETS_SETUP.md` - IAM role trust policy
- ✅ `guide/GITHUB_SECRETS_SETUP.md` - IAM role trust policy

### Configuration Files
- ✅ `src/backend/ecosystem.config.js` - Production and staging repo URLs
- ✅ `core/server/ecosystem.config.js` - Production and staging repo URLs

### API Responses
- ✅ `packages/backend/src/index.ts` - API name in root endpoint

## 🔄 What Changed

**From:** `sui-faucet-core` / `sui-faucet-core-node`  
**To:** `sui-fx`

All references to the old repository name have been updated to reflect the new "SUI-FX" branding throughout the codebase, documentation, and configuration files.

## ⚡ Production Status

The running production service will continue to operate normally. The name changes are primarily in documentation and future deployments. The API will now identify itself as "SUI-FX Testnet Faucet API" in responses.
