// API Base URL and endpoints
const API_BASE = 'http://localhost:5173';  // Base URL for development
const ENDPOINTS = {
  NUDGE: `/api/studio/picks/nudge`,  // Keep base endpoint without trailing slash
  USERS: `/api/user`,
  MEDIA: `/api/media`,
  FOLDERS: `/api/folders`,
  CAMPAIGN: `/api/campaign`  // New campaign endpoint
};

import useConfigStore from './config';

// Helper function to log API requests
async function logApiRequest(method, url, options = {}) {
  try {
    const { logNetworkTraffic } = useConfigStore.getState();
    if (!logNetworkTraffic) return;

    const { headers = {}, body } = options;
    const { logNetwork } = await import('./storage');
    await logNetwork({
      type: 'api',
      operation: {
        type: 'request',
        method,
        url,
        headers,
        body: body ? JSON.parse(body) : undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

// Helper function to log API responses
async function logApiResponse(url, response, error = null) {
  try {
    const { logNetworkTraffic } = useConfigStore.getState();
    if (!logNetworkTraffic) return;

    const { logNetwork } = await import('./storage');
    const responseData = {
      type: error ? 'error' : 'success',
      operation: {
        type: 'response',
        url,
        status: response?.status,
        statusText: response?.statusText,
        headers: response?.headers ? Object.fromEntries(Object.entries(response.headers)) : undefined,
        timestamp: new Date().toISOString()
      }
    };

    if (error) {
      responseData.error = {
        message: error.message,
        stack: error.stack
      };
    }

    await logNetwork(responseData);
  } catch (error) {
    console.error('Failed to log API response:', error);
  }
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

// Helper function to make API calls with proper configuration
async function makeApiCall(endpoint, options = {}) {
  const { useMockData, apiBaseUrl, captureResponses } = useConfigStore.getState();
  
  // Construct the full URL
  const baseUrl = useMockData ? API_BASE : apiBaseUrl;
  const fullUrl = `${baseUrl}${endpoint}`;
  
  console.log(`[API] Making ${options.method || 'GET'} request to ${fullUrl}`, {
    useMockData,
    options
  });
  
  await logApiRequest(options.method || 'GET', fullUrl, options);
  
  try {
    let response;
    if (useMockData) {
      // Get fresh data from IndexedDB for each request when using mock data
      const { getAllFromStore, getFromStore } = await import('./storage');
      
      // Parse the endpoint to determine the store and id
      const parts = endpoint.split('/').filter(p => p);
      let store = parts[parts.length - 2] === 'picks' ? parts[parts.length - 1] : parts[1];
      const id = parts[parts.length - 1] !== store ? parts[parts.length - 1] : null;
      
      // Map API endpoints to store names
      const storeMap = {
        'user': 'users',
        'nudge': 'nudges',
        'media': 'media',
        'folders': 'folders'
      };
      
      store = storeMap[store] || store;
      
      let mockData;
      if (id && options.method !== 'POST') {
        // If we have an ID, get the specific item
        const item = await getFromStore(store, id);
        mockData = { data: item };
      } else {
        // Otherwise get all items
        const items = await getAllFromStore(store);
        mockData = { data: items };
      }

      response = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }

    // Store the response in mockResponses if capture is enabled
    if (captureResponses) {
      const { storeMockResponse } = await import('./storage');
      // Clone the response before storing since it will be consumed
      const responseClone = response.clone();
      const responseData = await responseClone.json();
      await storeMockResponse(
        { method: options.method || 'GET', url: fullUrl, headers: options.headers },
        responseClone,
        responseData
      );
    }

    await logApiResponse(fullUrl, response);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return handleResponse(response);
  } catch (error) {
    await logApiResponse(fullUrl, null, error);
    throw error;
  }
}

// Helper function to determine if we should capture this response
function shouldCaptureResponse(request) {
  try {
    const url = new URL(request.url);
    
    // Don't capture authentication or refresh token requests
    if (url.pathname.includes('/auth/') || url.pathname.includes('/token')) {
      return false;
    }
    
    // Only capture GET and POST requests
    if (!['GET', 'POST'].includes(request.method)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Invalid URL in shouldCaptureResponse:', error);
    return false;
  }
}

// API Functions
export async function fetchUsers() {
  return makeApiCall(ENDPOINTS.USERS);
}

export async function fetchUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const url = `${ENDPOINTS.USERS}/${userId}`;
  const options = {
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

export async function createUser(data) {
  if (!data) {
    throw new Error('User data is required');
  }

  const url = ENDPOINTS.USERS;
  const options = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function updateUser(userId, data) {
  if (!userId || !data) {
    throw new Error('User ID and data are required');
  }

  const url = `${ENDPOINTS.USERS}/${userId}`;
  const options = {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function deleteUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const url = `${ENDPOINTS.USERS}/${userId}`;
  const options = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

// Nudge-related API calls
export async function fetchNudge(nudgeId) {
  if (!nudgeId) {
    throw new Error('Nudge ID is required');
  }

  const url = `${ENDPOINTS.NUDGE}/${nudgeId}`;
  const options = {
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

export async function fetchNudges() {
  const url = ENDPOINTS.NUDGE;
  const options = {
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

export async function createNudge(data) {
  if (!data) {
    throw new Error('Nudge data is required');
  }

  const url = ENDPOINTS.NUDGE;
  const options = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function updateNudge(nudgeId, data) {
  if (!nudgeId || !data) {
    throw new Error('Nudge ID and data are required');
  }

  const url = `${ENDPOINTS.NUDGE}/${nudgeId}`;
  const options = {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function deleteNudge(nudgeId) {
  if (!nudgeId) {
    throw new Error('Nudge ID is required');
  }

  const url = `${ENDPOINTS.NUDGE}/${nudgeId}`;
  const options = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

// Media-related API calls
export async function fetchMedia(folderId = '') {
  const url = folderId ? `${ENDPOINTS.MEDIA}?folderId=${folderId}` : ENDPOINTS.MEDIA;
  return makeApiCall(url);
}

export async function fetchMediaItem(mediaId) {
  if (!mediaId) {
    throw new Error('Media ID is required');
  }

  const url = `${ENDPOINTS.MEDIA}/${mediaId}`;
  return makeApiCall(url);
}

export async function uploadMedia(data, folderId = '') {
  const formData = new FormData();
  
  if (data instanceof File) {
    formData.append('file', data);
  } else if (data.file) {
    formData.append('file', data.file);
    delete data.file;
  }

  if (folderId) {
    formData.append('folderId', folderId);
  }

  // Append any additional metadata
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const url = ENDPOINTS.MEDIA;
  const options = {
    method: 'POST',
    body: formData
  };

  return makeApiCall(url, options);
}

export async function updateMedia(mediaId, data) {
  if (!mediaId || !data) {
    throw new Error('Media ID and data are required');
  }

  const url = `${ENDPOINTS.MEDIA}/${mediaId}`;
  const options = {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function deleteMedia(mediaId) {
  if (!mediaId) {
    throw new Error('Media ID is required');
  }

  const url = `${ENDPOINTS.MEDIA}/${mediaId}`;
  const options = {
    method: 'DELETE'
  };

  return makeApiCall(url, options);
}

// Folder-related API calls
export async function fetchFolders() {
  const { useMockData } = useConfigStore.getState();
  if (useMockData) {
    const { getAllFromStore } = await import('./storage');
    const folders = await getAllFromStore('folders');
    return folders || [];
  }
  return makeApiCall(ENDPOINTS.FOLDERS);
}

export async function fetchFolder(folderId) {
  if (!folderId) {
    throw new Error('Folder ID is required');
  }

  const url = `${ENDPOINTS.FOLDERS}/${folderId}`;
  return makeApiCall(url);
}

export async function createFolder(data) {
  const url = ENDPOINTS.FOLDERS;
  const options = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function updateFolder(folderId, data) {
  if (!folderId || !data) {
    throw new Error('Folder ID and data are required');
  }

  const url = `${ENDPOINTS.FOLDERS}/${folderId}`;
  const options = {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return makeApiCall(url, options);
}

export async function deleteFolder(folderId) {
  if (!folderId) {
    throw new Error('Folder ID is required');
  }

  const url = `${ENDPOINTS.FOLDERS}/${folderId}`;
  const options = {
    method: 'DELETE'
  };

  return makeApiCall(url, options);
}

// Campaign-related API calls
export async function activateCampaign(campaignId) {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  const url = `${ENDPOINTS.CAMPAIGN}/activate`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ campaignId })
  };

  return makeApiCall(url, options);
}

export async function deactivateCampaign(campaignId) {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  const url = `${ENDPOINTS.CAMPAIGN}/deactivate`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ campaignId })
  };

  return makeApiCall(url, options);
}

export async function testCampaign(campaignId) {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  const url = `${ENDPOINTS.CAMPAIGN}/test`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ campaignId })
  };

  return makeApiCall(url, options);
}