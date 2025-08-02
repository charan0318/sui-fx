# SUI-FX API Client Management System

## Overview

The SUI-FX faucet now supports OAuth-style API client registration, allowing users to create applications and receive unique API keys instead of sharing a single system-wide key.

## Features

### 🔐 Multi-Tenant API Keys
- Users can register applications and receive unique API keys
- Each client has its own usage tracking and analytics
- Per-client rate limiting overrides
- Graceful fallback to legacy API key system

### 📊 Usage Analytics
- Request count tracking per client
- Response time monitoring
- Endpoint usage analytics
- Daily and historical usage statistics

### 🛡️ Security & Management
- Client activation/deactivation
- API key regeneration
- Admin oversight and management
- Audit logging for all operations

## API Endpoints

### Public Registration

#### Register New Client
```http
POST /api/v1/clients/register
Content-Type: application/json

{
  "name": "My Awesome App",
  "description": "A description of my application",
  "homepage_url": "https://example.com",
  "callback_url": "https://example.com/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_id": "suifx_a1b2c3d4e5f6...",
    "name": "My Awesome App",
    "api_key": "suifx_xyz123...",
    "created_at": "2025-01-01T12:00:00Z",
    "is_active": true
  },
  "message": "API client created successfully. Please save your API key - it will not be shown again."
}
```

#### Registration Form
```http
GET /api/v1/clients/register/form
```
A user-friendly HTML form for registering API clients.

#### Get Client Info
```http
GET /api/v1/clients/{client_id}
```

### Admin Endpoints (Requires JWT Token)

#### List All Clients
```http
GET /api/v1/clients/admin/list?limit=50&offset=0
Authorization: Bearer <admin_jwt_token>
```

#### Deactivate Client
```http
POST /api/v1/clients/admin/{client_id}/deactivate
Authorization: Bearer <admin_jwt_token>
```

#### Regenerate API Key
```http
POST /api/v1/clients/admin/{client_id}/regenerate-key
Authorization: Bearer <admin_jwt_token>
```

## Using Your API Key

### Faucet Request with Client API Key
```http
POST /api/v1/faucet/request
X-API-Key: suifx_your_api_key_here
Content-Type: application/json

{
  "walletAddress": "0x..."
}
```

### Alternative Authorization Methods
```http
# Using Authorization header
Authorization: Bearer suifx_your_api_key_here

# Using plain Authorization header
Authorization: suifx_your_api_key_here
```

## Legacy Compatibility

The system maintains full backward compatibility:
- Existing API key (`suisuisui`) continues to work
- No changes required for existing integrations
- New clients can use either legacy or client-specific keys

## Database Requirements

The API client system requires PostgreSQL for:
- Client registration storage
- Usage analytics tracking
- Admin management features

**Without Database:**
- Client registration returns "service unavailable"
- Legacy API key authentication continues to work
- All faucet functionality remains operational

## Rate Limiting

### Client-Specific Limits
- Clients can have custom rate limit overrides
- Usage tracked per client for analytics
- Admin can adjust limits per application

### Default Behavior
- Falls back to IP-based rate limiting
- Legacy API key uses system defaults
- Graceful degradation if database unavailable

## Implementation Details

### Database Schema
```sql
-- API Clients
CREATE TABLE api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(64) UNIQUE NOT NULL,
    api_key VARCHAR(128) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    rate_limit_override INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage Tracking
CREATE TABLE api_client_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(64) REFERENCES api_clients(client_id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_status INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication Flow
1. Extract API key from headers (`X-API-Key`, `Authorization`)
2. Check if key matches legacy admin key
3. If not, query database for registered client
4. Validate client is active
5. Record usage statistics
6. Proceed with request

### Error Handling
- **Missing API Key**: 401 with `MISSING_API_KEY`
- **Invalid API Key**: 401 with `INVALID_API_KEY`
- **Inactive Client**: 401 with `INACTIVE_CLIENT`
- **Database Unavailable**: 503 for registration, continues for auth
- **Validation Errors**: 400 with detailed field errors

## Security Considerations

### API Key Format
- Client keys: `suifx_` + 24-character random hex
- Client IDs: `suifx_` + 16-character random hex
- Client secrets: `suifx_secret_` + 32-character random hex

### Admin Access
- JWT tokens required for admin endpoints
- API key bypass for Discord bot integration
- Rate limiting on admin endpoints

### Data Protection
- Client secrets never returned after creation
- API keys only shown once during registration
- Usage logs include minimal PII (IP addresses hashed)

## Development & Testing

### Local Development
1. Start backend: `npm run dev`
2. Visit registration form: `http://localhost:3001/api/v1/clients/register/form`
3. Register test client
4. Use returned API key for faucet requests

### Testing Without Database
- Server runs with graceful database fallback
- Registration shows "service unavailable"
- Legacy authentication continues working
- All faucet functionality operational

### Production Setup
1. Configure PostgreSQL database
2. Set `DATABASE_URL` environment variable
3. Run database migrations on startup
4. Monitor client registrations and usage

## Monitoring & Analytics

### Available Metrics
- Total API clients registered
- Active vs inactive clients
- Requests per client
- Average response times
- Most popular endpoints
- Rate limit violations

### Admin Dashboard
Access via `/api/v1/clients/admin/list` with proper authentication to see:
- Client list with usage statistics
- Recent activity per client
- Rate limiting configuration
- Deactivation controls

## Future Enhancements

### Planned Features
- 📈 Rich analytics dashboard
- 🔄 Webhook support for events
- 🎯 Advanced rate limiting rules
- 📧 Email notifications for clients
- 🔐 OAuth 2.0 flow support
- 📱 Mobile SDK integration

### Integration Opportunities
- Discord bot client registration
- Web dashboard for client management
- CI/CD pipeline integration
- Third-party authentication providers

---

## Quick Start Example

1. **Register your application:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/clients/register \
     -H "Content-Type: application/json" \
     -d '{"name": "My Test App", "homepage_url": "https://myapp.com"}'
   ```

2. **Save the API key from response**

3. **Use your API key:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/faucet/request \
     -H "X-API-Key: suifx_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"walletAddress": "0x..."}'
   ```

4. **Check your usage:**
   ```bash
   curl http://localhost:3001/api/v1/clients/your_client_id
   ```

That's it! You now have your own dedicated API key for the SUI-FX faucet with usage tracking and analytics.
