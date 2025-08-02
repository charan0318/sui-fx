# 🎨 SUI-FX Frontend Design Specifications

## 🚀 **PROJECT OVERVIEW**
Design a modern, user-friendly frontend for the SUI-FX testnet faucet that matches the production backend API.

---

## 📋 **REQUIRED PAGES & COMPONENTS**

### 🏠 **1. MAIN FAUCET PAGE** (Primary User Interface)

#### **Hero Section**
- **Title**: "SUI-FX Testnet Faucet"
- **Subtitle**: "Get SUI testnet tokens instantly for development"
- **Network Badge**: "Sui Testnet" with green indicator
- **Status Indicator**: Live/Offline status from `/api/v1/health`

#### **Faucet Form** (Center of page)
```
┌─────────────────────────────────────────┐
│  Enter your SUI wallet address          │
│  ┌─────────────────────────────────────┐ │
│  │ 0x...                               │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Amount: 0.1 SUI (Fixed)                │
│                                         │
│  [Request Tokens] 🚀                   │
└─────────────────────────────────────────┘
```

#### **Form Validation**
- **Input**: Wallet address (64 hex characters)
- **Format**: `0x` prefix optional
- **Real-time validation**: Show checkmark/error icon
- **Error Messages**: 
  - "Invalid wallet address format"
  - "Address must be 64 hex characters"

#### **Rate Limiting Display**
```
⏱️ Rate Limits:
• 1 request per hour per wallet
• 100 requests per hour per IP
• Next request available in: 45 minutes
```

#### **Transaction Result**
- **Success State**: 
  - ✅ "Tokens sent successfully!"
  - Transaction hash with copy button
  - Explorer link to SuiScan
  - Amount sent (0.1 SUI)
- **Error States**:
  - ❌ Rate limit exceeded
  - ❌ Invalid address
  - ❌ Server error

---

### 🔧 **2. ADMIN DASHBOARD** (`/admin`)

#### **Login Page**
```
┌─────────────────────────────────────────┐
│         🔐 Admin Login                  │
│                                         │
│  Username: [____________]               │
│  Password: [____________]               │
│                                         │
│  [Login] 🚀                            │
└─────────────────────────────────────────┘
```

#### **Dashboard Layout** (After login)
```
┌─────────────────────────────────────────────────────┐
│  SUI-FX Admin Dashboard             [Logout] 🚪     │
├─────────────────────────────────────────────────────┤
│  📊 SYSTEM STATUS                                   │
│  ┌─────────────┬─────────────┬─────────────────────┐│
│  │   Status    │   Uptime    │   Version           ││
│  │  🟢 Healthy │   2h 30m    │   v1.0.0           ││
│  └─────────────┴─────────────┴─────────────────────┘│
│                                                     │
│  💰 WALLET INFO                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │  Address: 0x1234...abcd                         ││
│  │  Balance: 50.5 SUI                              ││
│  │  Status: 🟢 Sufficient                          ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  📈 STATISTICS                                      │
│  ┌─────────────┬─────────────┬─────────────────────┐│
│  │Total Requests│ Successful │  Success Rate       ││
│  │     150      │    145     │     96.67%          ││
│  └─────────────┴─────────────┴─────────────────────┘│
│                                                     │
│  📋 RECENT TRANSACTIONS                             │
│  [Table with: Time, Address, Amount, Status, Hash] │
└─────────────────────────────────────────────────────┘
```

#### **Navigation Tabs**
- **Dashboard** (Overview)
- **Transactions** (Full transaction history)
- **Rate Limits** (Current rate limit status)
- **System Health** (Service status details)
- **Settings** (Admin configuration)

---

### 📚 **3. DOCUMENTATION PAGE** (`/docs`)

#### **API Documentation**
- **Interactive API Explorer**: Embed the existing Swagger UI
- **Quick Start Guide**: How to use the faucet
- **Rate Limits**: Detailed explanation
- **Error Codes**: Complete error reference
- **SDKs & Examples**: Code examples in different languages

#### **Page Structure**
```
┌─────────────────────────────────────────────────────┐
│  📚 SUI-FX API Documentation                        │
├─────────────────────────────────────────────────────┤
│  [Quick Start] [API Reference] [Examples] [SDKs]   │
│                                                     │
│  🚀 Quick Start                                     │
│  • Get your API key                                │
│  • Make your first request                         │
│  • Handle responses                                │
│                                                     │
│  📡 API Endpoints                                   │
│  [Embedded Swagger UI from /api/v1/docs]           │
└─────────────────────────────────────────────────────┘
```

---

### ℹ️ **4. ABOUT/STATUS PAGE** (`/status`)

```
┌─────────────────────────────────────────────────────┐
│  ℹ️ SUI-FX Status & Information                     │
├─────────────────────────────────────────────────────┤
│  🌐 Network: Sui Testnet                           │
│  🪙 Amount per request: 0.1 SUI                    │
│  ⏱️ Rate limit: 1 request/hour per wallet          │
│  📊 Uptime: 99.9%                                  │
│  🔗 Explorer: SuiScan Testnet                      │
│                                                     │
│  📈 Live Statistics:                               │
│  • Total tokens distributed: 1,234.5 SUI          │
│  • Total requests served: 12,345                   │
│  • Active users: 234                               │
└─────────────────────────────────────────────────────┘
```

---

### 🆕 **5. API CLIENT MANAGEMENT** (`/api-clients`) - **NEW!**

#### **Client Registration Page** (`/api-clients/register`)
```
┌─────────────────────────────────────────────────────┐
│  🔑 Register Your Application                       │
├─────────────────────────────────────────────────────┤
│  Get your own API key for SUI-FX faucet            │
│                                                     │
│  Application Name *: [_________________]            │
│  Description:       [_________________]             │
│                    [_________________]             │
│                    [_________________]             │
│  Homepage URL:      [_________________]             │
│  Callback URL:      [_________________]             │
│                                                     │
│  [Register Application] 🚀                         │
│                                                     │
│  ⚠️ Your API key will only be shown once!          │
└─────────────────────────────────────────────────────┘
```

#### **Registration Success Modal**
```
┌─────────────────────────────────────────────────────┐
│  ✅ Application Registered Successfully!            │
├─────────────────────────────────────────────────────┤
│  Client ID:                                         │
│  suifx_a1b2c3d4e5f6...              [Copy] 📋      │
│                                                     │
│  API Key: ⚠️ SAVE THIS NOW - Won't show again!     │
│  suifx_xyz123abc...                 [Copy] 📋      │
│                                                     │
│  [View My Dashboard] [Close]                        │
└─────────────────────────────────────────────────────┘
```

#### **Client Dashboard** (`/api-clients/dashboard/:clientId`)
```
┌─────────────────────────────────────────────────────┐
│  📊 My Application Dashboard                        │
├─────────────────────────────────────────────────────┤
│  🔑 Application: My Awesome DApp                    │
│  📅 Created: Jan 15, 2025                          │
│  🟢 Status: Active                                 │
│  🔗 Homepage: https://mydapp.com                    │
│                                                     │
│  📈 USAGE STATISTICS                                │
│  ┌─────────────┬─────────────┬─────────────────────┐│
│  │Total Requests│   Today    │  Last 24 Hours     ││
│  │     1,234    │     45     │       67           ││
│  └─────────────┴─────────────┴─────────────────────┘│
│                                                     │
│  📊 Performance: Avg Response Time: 245ms          │
│                                                     │
│  🔧 ACTIONS                                        │
│  [Regenerate API Key] [View Integration Guide]     │
│                                                     │
│  📋 RECENT REQUESTS                                │
│  [Table: Time, Endpoint, Status, Response Time]    │
└─────────────────────────────────────────────────────┘
```

#### **Integration Guide Modal**
```
┌─────────────────────────────────────────────────────┐
│  🔧 Integration Guide                               │
├─────────────────────────────────────────────────────┤
│  📝 Your API Key:                                   │
│  suifx_your_key_here...             [Copy] 📋      │
│                                                     │
│  💻 Example Request:                                │
│  curl -X POST                       [Copy] 📋      │
│    http://localhost:3001/api/v1/faucet/request      │
│    -H "X-API-Key: suifx_your_key_here"             │
│    -d '{"walletAddress": "0x..."}'                  │
│                                                     │
│  🔗 Documentation: [View Full API Docs]            │
│                                                     │
│  [Close]                                            │
└─────────────────────────────────────────────────────┘
```

---

### 📱 **6. MAIN NAVIGATION UPDATE** - **NEW!**

Update your main navigation to include:
```
┌─────────────────────────────────────────────────────┐
│  🌊 SUI-FX                                          │
│  [Faucet] [API Clients] [Docs] [Status] [Admin]    │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 **DESIGN SPECIFICATIONS**

### **Color Scheme**
- **Primary**: `#1976d2` (Sui Blue)
- **Secondary**: `#f50057` (Accent Pink)
- **Success**: `#4caf50` (Green)
- **Warning**: `#ff9800` (Orange)
- **Error**: `#f44336` (Red)
- **Background**: `#fafafa` (Light Gray)
- **Text**: `#333333` (Dark Gray)

### **Typography**
- **Headers**: Inter/Roboto Bold
- **Body**: Inter/Roboto Regular
- **Monospace**: JetBrains Mono (for addresses/hashes)

### **Components Needed**
1. **Input Field**: Wallet address with validation
2. **Button**: Primary action button with loading states
3. **Status Cards**: For system status display
4. **Data Table**: For transaction history
5. **Toast Notifications**: For success/error messages
6. **Loading Spinner**: For async operations
7. **Copy Button**: For addresses and hashes
8. **Progress Bar**: For rate limit timers
9. **🆕 Modal**: For API key display and integration guide
10. **🆕 Tabs**: For client dashboard navigation
11. **🆕 Form Components**: Multi-step registration form
12. **🆕 Statistics Cards**: Usage analytics display

---

## 🔌 **API INTEGRATION REQUIREMENTS**

### **Endpoints to Integrate**

#### **1. Main Faucet** (`POST /api/v1/faucet/request`)
```javascript
// Request
{
  "walletAddress": "0x1234...abcd"
}

// Response (Success)
{
  "success": true,
  "message": "Tokens sent successfully!",
  "data": {
    "transactionHash": "0x5AbRLKAT9cr66TNEvpGwbz4teVDSJc7qZcuDGuukDa69",
    "amount": "100000000",
    "walletAddress": "0x1234...abcd",
    "network": "testnet",
    "explorerUrl": "https://suiscan.xyz/testnet/tx/5AbRLKAT9cr..."
  }
}
```

#### **🆕 NEW! API Client Endpoints**

#### **6. Register API Client** (`POST /api/v1/clients/register`)
```javascript
// Request
{
  "name": "My Awesome App",
  "description": "A description of my application",
  "homepage_url": "https://myapp.com",
  "callback_url": "https://myapp.com/callback"
}

// Response
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

#### **7. Get Client Info** (`GET /api/v1/clients/:clientId`)
```javascript
// Response
{
  "success": true,
  "data": {
    "client_id": "suifx_a1b2c3d4e5f6...",
    "name": "My Awesome App",
    "description": "A description of my application",
    "homepage_url": "https://myapp.com",
    "is_active": true,
    "created_at": "2025-01-01T12:00:00Z",
    "last_used_at": "2025-01-01T15:30:00Z",
    "usage_count": 142,
    "stats": {
      "total_requests": 142,
      "requests_today": 15,
      "last_24h_requests": 28,
      "avg_response_time": 245
    }
  }
}
```

#### **8. Client Registration Form** (`GET /api/v1/clients/register/form`)
```
Returns HTML registration form (already built in backend)
```

#### **2. Health Check** (`GET /api/v1/health`)
```javascript
// Response
{
  "status": "healthy",
  "timestamp": "2025-07-26T12:48:50.7255Z",
  "uptime": "2h 30m",
  "services": {
    "database": "connected",
    "redis": "connected", 
    "sui": "connected"
  }
}
```

#### **3. Admin Login** (`POST /api/v1/admin/login`)
```javascript
// Request
{
  "username": "admin",
  "password": "admin123production"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "username": "admin",
      "role": "super_admin"
    }
  }
}
```

#### **4. Admin Dashboard** (`GET /api/v1/admin/dashboard`)
```javascript
// Response (with Bearer token)
{
  "success": true,
  "data": {
    "system": {
      "status": "healthy",
      "uptime": "2h 30m",
      "version": "1.0.0"
    },
    "wallet": {
      "address": "0x1234...abcd",
      "balance": "50500000000",
      "network": "testnet"
    },
    "stats": {
      "totalRequests": 150,
      "successfulRequests": 145,
      "failedRequests": 5,
      "successRate": "96.67%"
    }
  }
}
```

#### **5. Metrics** (`GET /api/v1/metrics`)
```javascript
// Response
{
  "success": true,
  "data": {
    "timestamp": "2025-07-26T12:48:50.7255Z",
    "uptime": 137.4091283,
    "requests": {
      "total": 150,
      "successful": 145,
      "failed": 5
    },
    "system": {
      "memory": {...},
      "cpu": {...}
    }
  }
}
```

---

## 🔐 **AUTHENTICATION FLOW**

### **API Key Authentication** (For faucet requests)
```javascript
// Headers required - NEW! Now supports both legacy and client keys
{
  "X-API-Key": "suisuisui", // Legacy key (still works)
  // OR
  "X-API-Key": "suifx_your_client_api_key_here", // New client key
  "Content-Type": "application/json"
}
```

### **🆕 NEW! Client API Key Usage**
```javascript
// Example with client API key
fetch('/api/v1/faucet/request', {
  method: 'POST',
  headers: {
    'X-API-Key': 'suifx_abc123...', // Your unique client key
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: '0x...'
  })
})
```

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

### **Mobile Considerations**
- **Stack forms vertically**
- **Larger touch targets**
- **Simplified navigation**
- **Condensed admin tables**

---

## 🚨 **ERROR HANDLING**

### **Error States to Handle**
1. **Network Errors**: Connection failed
2. **Rate Limiting**: 429 status codes
3. **Validation Errors**: 400 status codes  
4. **Authentication**: 401 status codes
5. **Server Errors**: 500 status codes

### **User-Friendly Error Messages**
- **Rate Limited**: "Please wait 45 minutes before requesting again"
- **Invalid Address**: "Please enter a valid SUI wallet address"
- **Network Error**: "Connection failed. Please try again."
- **Server Error**: "Service temporarily unavailable"

---

## ⚡ **PERFORMANCE REQUIREMENTS**

### **Loading States**
- **Button loading**: Show spinner during requests
- **Page loading**: Show skeleton screens
- **Auto-refresh**: Update dashboard every 30 seconds

### **Caching Strategy**
- **Static data**: Cache system status for 30 seconds
- **User data**: Don't cache sensitive information
- **Rate limits**: Cache and display countdown timers

---

## 🎯 **KEY FEATURES TO IMPLEMENT**

### **Priority 1** (Core Functionality)
1. ✅ **Faucet Request Form** with validation
2. ✅ **Transaction Status Display** 
3. ✅ **Rate Limit Information**
4. ✅ **Error Handling**

### **🆕 Priority 1.5** (NEW API Client Features - High Priority)
1. 🆕 **API Client Registration Form**
2. 🆕 **Registration Success Modal** with API key display
3. 🆕 **Client Dashboard** with usage statistics
4. 🆕 **Integration Guide Modal**
5. 🆕 **Navigation Update** to include API Clients

### **Priority 2** (Admin Features)  
1. ✅ **Admin Login**
2. ✅ **Dashboard Overview**
3. ✅ **Transaction History**
4. ✅ **System Status**

### **Priority 3** (Nice-to-Have)
1. ✅ **API Documentation Page**
2. ✅ **Real-time Updates**
3. ✅ **Dark Mode Toggle**
4. ✅ **Mobile Optimization**

---

## 🛠️ **RECOMMENDED TECH STACK**

### **Framework Options**
- **React**: With TypeScript for type safety
- **Next.js**: For SSR and routing
- **Vue.js**: Alternative option
- **Svelte**: Lightweight option

### **UI Libraries**
- **Material-UI**: Matches the Swagger UI theme
- **Ant Design**: Good for admin dashboards
- **Chakra UI**: Clean and modern
- **Tailwind CSS**: Custom styling

### **State Management**
- **React Query/TanStack**: For API state
- **Zustand**: Lightweight state management
- **Context API**: For simple state

---

## 📋 **FINAL CHECKLIST**

### **Before Launch**
- [ ] All API endpoints integrated
- [ ] Error handling implemented
- [ ] Responsive design tested
- [ ] Admin authentication working
- [ ] Rate limiting displays correctly
- [ ] Transaction links to explorer work
- [ ] Loading states implemented
- [ ] Form validation working
- [ ] Copy-to-clipboard functions
- [ ] Mobile-friendly interface
- [ ] 🆕 **API client registration working**
- [ ] 🆕 **Client dashboard displaying stats**
- [ ] 🆕 **API key copy-to-clipboard**
- [ ] 🆕 **Integration guide accessible**
- [ ] 🆕 **Navigation includes API Clients**

This specification gives you everything needed to build a production-ready frontend that perfectly matches your SUI-FX backend! 🚀
