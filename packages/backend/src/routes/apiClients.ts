import express from 'express';
import { apiClientService } from '../services/apiClient.js';
import { logger } from '../utils/logger.js';
import { databaseService } from '../services/database.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const router = express.Router();

// JWT middleware for admin endpoints
const authenticateJWT = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow Discord bot with API key to access admin endpoints
  const apiKey = req.get('X-API-Key');
  const userAgent = req.get('User-Agent') || '';

  if (apiKey === config.auth.apiKey && userAgent.includes('axios')) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '🚫 Admin authentication required. Please login first.',
      error: {
        code: 'ADMIN_AUTH_REQUIRED',
        details: 'Use POST /api/v1/admin/login to get access token',
      },
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const jwtSecret = process.env.JWT_SECRET || 'changeme';
    jwt.verify(token, jwtSecret, {
      issuer: 'sui-fx-admin',
      audience: 'sui-fx-api'
    });
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '🚫 Invalid or expired admin token',
      error: {
        code: 'INVALID_ADMIN_TOKEN',
        details: 'Please login again to get a new token',
      },
    });
  }
};

/**
 * Public API client registration endpoint
 * POST /api/v1/clients/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, description, homepage_url, callback_url } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Application name is required'
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Application name must be less than 100 characters'
      });
    }

    // Optional field validation
    if (description && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({
        success: false,
        error: 'Description must be a string less than 500 characters'
      });
    }

    if (homepage_url && typeof homepage_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Homepage URL must be a valid URL string'
      });
    }

    if (callback_url && typeof callback_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Callback URL must be a valid URL string'
      });
    }

    // Check if database is available
    if (!databaseService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'API client registration is currently unavailable. Please try again later.'
      });
    }

    const client = await apiClientService.createClient({
      name: name.trim(),
      description: description?.trim(),
      homepage_url: homepage_url?.trim(),
      callback_url: callback_url?.trim()
    });

    // Return client info (excluding sensitive data like client_secret)
    res.status(201).json({
      success: true,
      data: {
        client_id: client.client_id,
        name: client.name,
        description: client.description,
        homepage_url: client.homepage_url,
        callback_url: client.callback_url,
        api_key: client.api_key,
        created_at: client.created_at,
        is_active: client.is_active
      },
      message: 'API client created successfully. Please save your API key - it will not be shown again.'
    });

  } catch (error) {
    logger.error('API client registration failed', { 
      error: error.message,
      body: req.body 
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create API client'
    });
  }
});

/**
 * Get client information by client ID
 * GET /api/v1/clients/:clientId
 */
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }

    const client = await apiClientService.getClientById(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Get usage statistics
    const stats = await apiClientService.getClientStats(clientId);

    // Return public client info (excluding sensitive data)
    res.json({
      success: true,
      data: {
        client_id: client.client_id,
        name: client.name,
        description: client.description,
        homepage_url: client.homepage_url,
        callback_url: client.callback_url,
        is_active: client.is_active,
        created_at: client.created_at,
        last_used_at: client.last_used_at,
        usage_count: client.usage_count,
        stats: stats || {
          total_requests: 0,
          requests_today: 0,
          last_24h_requests: 0,
          avg_response_time: 0
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get client info', { 
      error: error.message,
      clientId: req.params.clientId 
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client information'
    });
  }
});

/**
 * Admin endpoint - List all clients
 * GET /api/v1/clients/admin/list
 */
router.get('/admin/list', authenticateJWT, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const clients = await apiClientService.listClients(limit, offset);

    // Return client list (excluding sensitive data)
    const sanitizedClients = clients.map(client => ({
      client_id: client.client_id,
      name: client.name,
      description: client.description,
      homepage_url: client.homepage_url,
      callback_url: client.callback_url,
      is_active: client.is_active,
      created_at: client.created_at,
      last_used_at: client.last_used_at,
      usage_count: client.usage_count,
      rate_limit_override: client.rate_limit_override
    }));

    res.json({
      success: true,
      data: {
        clients: sanitizedClients,
        pagination: {
          limit,
          offset,
          count: clients.length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to list clients', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client list'
    });
  }
});

/**
 * Admin endpoint - Deactivate client
 * POST /api/v1/clients/admin/:clientId/deactivate
 */
router.post('/admin/:clientId/deactivate', authenticateJWT, async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }

    const success = await apiClientService.deactivateClient(clientId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or already deactivated'
      });
    }

    res.json({
      success: true,
      message: 'Client deactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to deactivate client', { 
      error: error.message,
      clientId: req.params.clientId 
    });

    res.status(500).json({
      success: false,
      error: 'Failed to deactivate client'
    });
  }
});

/**
 * Admin endpoint - Regenerate API key
 * POST /api/v1/clients/admin/:clientId/regenerate-key
 */
router.post('/admin/:clientId/regenerate-key', authenticateJWT, async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }

    // Check if client exists first
    const client = await apiClientService.getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const newApiKey = await apiClientService.regenerateApiKey(clientId);
    
    if (!newApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Failed to regenerate API key'
      });
    }

    res.json({
      success: true,
      data: {
        api_key: newApiKey
      },
      message: 'API key regenerated successfully. Please save the new key - it will not be shown again.'
    });

  } catch (error) {
    logger.error('Failed to regenerate API key', { 
      error: error.message,
      clientId: req.params.clientId 
    });

    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key'
    });
  }
});

/**
 * Get registration form HTML (for easy client registration)
 * GET /api/v1/clients/register/form
 */
router.get('/register/form', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SUI-FX API Client Registration</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 28px;
        }
        
        .header p {
            color: #718096;
            font-size: 16px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #4a5568;
            font-weight: 500;
        }
        
        input, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .required {
            color: #e53e3e;
        }
        
        .submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .result {
            margin-top: 20px;
            padding: 16px;
            border-radius: 8px;
            display: none;
        }
        
        .success {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            color: #22543d;
        }
        
        .error {
            background: #fed7d7;
            border: 1px solid #feb2b2;
            color: #742a2a;
        }
        
        .api-key {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 12px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 10px 0;
        }
        
        .copy-btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SUI-FX API Registration</h1>
            <p>Register your application to get an API key</p>
        </div>
        
        <form id="registrationForm">
            <div class="form-group">
                <label for="name">Application Name <span class="required">*</span></label>
                <input type="text" id="name" name="name" required maxlength="100" 
                       placeholder="My Awesome App">
            </div>
            
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" maxlength="500" 
                          placeholder="Brief description of your application..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="homepage_url">Homepage URL</label>
                <input type="url" id="homepage_url" name="homepage_url" 
                       placeholder="https://example.com">
            </div>
            
            <div class="form-group">
                <label for="callback_url">Callback URL</label>
                <input type="url" id="callback_url" name="callback_url" 
                       placeholder="https://example.com/callback">
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">
                Register Application
            </button>
        </form>
        
        <div id="result" class="result"></div>
    </div>

    <script>
        document.getElementById('registrationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const result = document.getElementById('result');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            result.style.display = 'none';
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/v1/clients/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const responseData = await response.json();
                
                if (responseData.success) {
                    result.className = 'result success';
                    result.innerHTML = \`
                        <h3>Registration Successful!</h3>
                        <p><strong>Client ID:</strong> \${responseData.data.client_id}</p>
                        <p><strong>API Key:</strong></p>
                        <div class="api-key">
                            \${responseData.data.api_key}
                            <button class="copy-btn" onclick="copyToClipboard('\${responseData.data.api_key}')">Copy</button>
                        </div>
                        <p><strong>⚠️ Important:</strong> Save your API key now - it will not be shown again!</p>
                    \`;
                    e.target.reset();
                } else {
                    throw new Error(responseData.error || 'Registration failed');
                }
            } catch (error) {
                result.className = 'result error';
                result.innerHTML = \`
                    <h3>Registration Failed</h3>
                    <p>\${error.message}</p>
                \`;
            }
            
            result.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Application';
        });
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('API key copied to clipboard!');
            });
        }
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

export default router;
