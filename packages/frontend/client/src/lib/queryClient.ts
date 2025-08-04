import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'suisuisui';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  authToken?: string,
): Promise<any> {
  // Convert relative URL to absolute backend URL
  let fullUrl: string;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url.startsWith('/api/v1/')) {
    // URL already has /api/v1/ prefix, use as-is
    fullUrl = url;
  } else if (url.startsWith('/api/')) {
    // URL has /api/ prefix, use as-is
    fullUrl = url;
  } else if (url.startsWith('/')) {
    // Absolute path starting with /, prepend API_BASE_URL
    fullUrl = `${API_BASE_URL}${url}`;
  } else {
    // Relative path, prepend API_BASE_URL with /
    fullUrl = `${API_BASE_URL}/${url}`;
  }
  
  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  console.log(`API Request: ${method} ${fullUrl}`, data);

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`API Response status: ${res.status}`);
    
    await throwIfResNotOk(res);
    const result = await res.json();
    console.log(`API Response:`, result);
    return result;
  } catch (error) {
    console.error(`API Request failed for ${method} ${fullUrl}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Convert relative URL to absolute backend URL
    const url = queryKey.join("/");
    let fullUrl: string;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (url.startsWith('/api/v1/')) {
      // Remove /api/v1/ prefix and append to API_BASE_URL
      const path = url.replace('/api/v1/', '');
      fullUrl = `${API_BASE_URL}/${path}`;
    } else if (url.startsWith('/api/')) {
      // Remove /api/ prefix and append to API_BASE_URL  
      const path = url.replace('/api/', '');
      fullUrl = `${API_BASE_URL}/${path}`;
    } else {
      fullUrl = `${API_BASE_URL}${url}`;
    }
    
    console.log(`Query: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      headers: {
        'x-api-key': API_KEY,
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const result = await res.json();
    console.log(`Query Response:`, result);
    return result;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
