# SUI-FX Faucet Development Guide for AI Agents

## Architecture Overview

**SUI-FX** is a production-ready Sui testnet faucet with a service-oriented architecture featuring graceful fallbacks and enterprise monitoring.

### Core Services Pattern
- **`suiService`** - Blockchain integration with dual modes (wallet/official faucet)
- **`databaseService`** - PostgreSQL with automatic fallback if unavailable  
- **`redisClient`** - Caching/rate limiting with in-memory fallback
- **Service Dependencies**: All services implement graceful degradation - the system continues operating even if Redis/DB are offline

### Project Structure
```
packages/backend/src/
├── services/        # Core business logic (sui, database, redis)
├── routes/          # API endpoints (faucet, admin, metrics, docs)
├── middleware/      # Auth, rate limiting, error handling
├── config/          # Environment-based configuration
└── utils/           # Logging, validation helpers
```

## Critical Development Patterns

### 1. Service Initialization Order
Services **must** be initialized with fallback handling:
```typescript
// In bootstrap.ts - all services handle connection failures gracefully
await memoryCacheService.connect(); // Never throws
await dataPersistenceService.connect(); // Logs warning, continues
await suiBlockchainService.initialize(); // Required for core functionality
```

### 2. Rate Limiting Architecture
Uses **multi-layer approach** with Redis primary + in-memory fallback:
- IP-based: 50 requests/hour (configurable)
- Wallet-based: 1 request/hour (strict)
- API authentication: Required for all faucet requests

### 3. Database Fallback Pattern
All database operations wrapped in try-catch with graceful degradation:
```typescript
try {
  await databaseService.saveTransaction(data);
} catch (error) {
  logger.warn('Database save failed - continuing without persistence');
  // Application continues normally
}
```

## Essential Commands

### Development Workflow
```bash
# Backend development (from packages/backend/)
npm run build     # TypeScript compilation required before start
npm start         # Runs compiled JS, not TS directly  
npm run dev       # Development with auto-restart

# Environment setup
cp .env.example .env  # Configure before first run
```

### Testing Endpoints
```bash
# Health check (always test first)
curl http://localhost:3001/api/v1/health

# Metrics (JSON format)  
curl http://localhost:3001/api/v1/metrics

# Metrics (Prometheus format)
curl -H "Accept: text/plain" http://localhost:3001/api/v1/metrics

# Faucet request (requires API key)
curl -X POST -H "x-api-key: suisuisui" -H "Content-Type: application/json" \
  -d '{"address":"0x64char_hex_address"}' \
  http://localhost:3001/api/v1/faucet/request
```

## Configuration Conventions

### Environment Variables
- **Required**: `SUI_PRIVATE_KEY` (for wallet mode) or rely on official faucet
- **Auth**: `API_KEY` (default: "suisuisui"), `JWT_SECRET`, admin credentials
- **Fallback-safe**: `DATABASE_URL`, `REDIS_URL` (app works without these)

### Service Modes
- **Faucet Mode**: Auto-detects wallet private key vs official Sui faucet
- **Database Mode**: PostgreSQL preferred, continues without if unavailable
- **Cache Mode**: Redis preferred, falls back to in-memory rate limiting

## Integration Points

### Admin Interface
- **JWT-based auth**: POST `/api/v1/admin/login` → Bearer token
- **Full transaction history**: GET `/api/v1/admin/transactions`  
- **Real-time metrics**: GET `/api/v1/admin/dashboard`

### External Dependencies
- **Sui RPC**: `https://fullnode.testnet.sui.io/` (configurable)
- **Official Faucet**: Auto-used when no private key configured
- **Database**: Optional PostgreSQL for transaction persistence
- **Redis**: Optional for enhanced rate limiting and metrics

### API Documentation
- **Interactive docs**: `/api/v1/docs` (custom JSON format)
- **OpenAPI spec**: `/api/v1/docs/openapi`
- **Swagger UI**: `/docs` (full interactive interface)

## Debugging Patterns

### Service Health Debugging
```typescript
// Check individual service status
const health = await suiService.healthCheck();  // Returns detailed status
const dbStatus = databaseService ? 'connected' : 'disconnected';
```

### Common Issues
- **Build required**: TypeScript must be compiled before `npm start`
- **Redis errors**: Normal - app continues with fallback rate limiting
- **Database SSL errors**: Normal - app continues without persistence  
- **Address validation**: Requires exactly 64 hex characters (Sui format)

## Deployment Notes

### Production Checklist
1. Set strong `API_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD` 
2. Configure `SUI_PRIVATE_KEY` for direct wallet control (optional)
3. Set up PostgreSQL and Redis for full functionality (optional)
4. Enable monitoring via `/api/v1/metrics` endpoint

### Monitoring Integration  
- **Prometheus**: Metrics endpoint supports native format
- **Health checks**: `/api/v1/health` returns service status
- **Request logging**: All requests logged with unique IDs for tracing
