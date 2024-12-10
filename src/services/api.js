// API Base URL and endpoints
const API_BASE = import.meta.env.DEV ? '' : 'https://backoffice-test.abaka.me';  // Use proxy in development
const ENDPOINTS = {
  TOKEN: '/api/enterprise/token',
  NUDGE_ALL: '/api/studio/picks/nudge',
  NUDGE_BY_ID: (id) => `/api/nudge/notification/${id}`,
  USERS: `/api/accessmanagement/users`,
  MEDIA: `/api/studio/media`,
  FOLDERS: `/api/studio/media/folders`,
  CAMPAIGN: `/api/campaign/activate`  // Updated campaign endpoint
};

import useConfigStore from './config';

// Authentication credentials
const AUTH_CREDENTIALS = {
  "AppId": "a4745b09-e957-47e1-977a-c762ada74110",
  "AppSecret": "F:CG660oWPj2lDyFjQ-tVF]v.c?oBy-g"
};

let authToken = null;

// Function to get authentication token
async function getAuthToken() {
  if (authToken) return authToken;

  const url = `${API_BASE}${ENDPOINTS.TOKEN}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-msw-bypass': 'true'
    },
    body: JSON.stringify(AUTH_CREDENTIALS)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get auth token');
  }

  const data = await response.json();
  authToken = data.token;
  return authToken;
}

// Helper function to log API requests
async function logApiRequest(method, url, options = {}) {
  try {
    const { logNetworkTraffic } = useConfigStore.getState();
    if (!logNetworkTraffic) return;

    const { headers = {}, body } = options;
    const { logNetwork } = await import('./storage/networkLogs');
    await logNetwork({
      type: 'api',
      operation: {
        type: 'request',
        method,
        url,
        headers: Object.fromEntries(Object.entries(headers)),
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

    const { logNetwork } = await import('./storage/networkLogs');
    const responseData = {
      type: error ? 'error' : (response?.ok ? 'success' : 'error'),
      operation: {
        type: 'response',
        url,
        status: response?.status,
        statusText: response?.statusText,
        headers: response?.headers ? Object.fromEntries(response.headers.entries()) : undefined,
        timestamp: new Date().toISOString()
      }
    };

    if (error || !response?.ok) {
      responseData.error = {
        message: error?.message || `HTTP error! status: ${response?.status}`,
        stack: error?.stack
      };
    } else if (response?.ok) {
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const clonedResponse = response.clone();
          responseData.operation.response = await clonedResponse.json();
        }
      } catch (err) {
        console.warn('Failed to capture response data:', err);
      }
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

// Helper function to calculate Content-Length
function calculateContentLength(body) {
  if (!body) return '0';
  return new TextEncoder().encode(body).length.toString();
}

// Helper function to get host from URL
function getHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    return window.location.host;
  }
}

// Helper function to make API calls with proper configuration
async function makeApiCall(endpoint, options = {}) {
  try {
    // Ensure options.headers exists
    options.headers = options.headers || {};

    // Build the full URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    // Set Content-Length header if there's a body and header doesn't exist
    if (options.body && !options.headers['Content-Length']) {
      options.headers['Content-Length'] = calculateContentLength(options.body);
    }

    // Set Host header if it doesn't exist
    if (!options.headers['Host']) {
      options.headers['Host'] = getHost(url);
    }

    // Add CORS headers
    options.headers['Origin'] = window.location.origin;
    options.mode = 'cors';
    options.credentials = 'include';

    // Add authentication token if available and not requesting a token
    if (!endpoint.includes(ENDPOINTS.TOKEN) && await getAuthToken()) {
      options.headers['Authorization'] = `Bearer ${await getAuthToken()}`;
    }

    // Log the request if enabled
    await logApiRequest(options.method || 'GET', url, options);

    // Make the API call
    const response = await fetch(url, {
      ...options,
      headers: options.headers
    });

    // Log the response if enabled
    await logApiResponse(url, response);

    // Handle the response
    return handleResponse(response);
  } catch (error) {
    console.error('API call error:', error);
    // Log error response if enabled
    await logApiResponse(endpoint, null, error);
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

// Transform data to NotificationRM format
const transformToNotificationRM = (formData) => {
  return {
    id: formData.id || undefined,
    title: formData.title,
    description: formData.description,
    channel: formData.channel,
    status: formData.status,
    type: formData.type,
    shortUrl: formData.shortUrl,
    priority: formData.priority,
    contentTemplate: typeof formData.contentTemplate === 'string' 
      ? formData.contentTemplate 
      : {
          nudgeCardName: formData.contentTemplate?.nudgeCardName || formData.title || '',
          title: formData.contentTemplate?.title || formData.title || '',
          welcomeMessage: formData.contentTemplate?.welcomeMessage || '',
          body: formData.contentTemplate?.body || formData.description || '',
          image: formData.contentTemplate?.image || '',
          callToActionLabel: formData.contentTemplate?.callToActionLabel || '',
          type: formData.contentTemplate?.type || 'INFO'
        },
    // Additional metadata stored in custom fields
    metadata: {
      collection: formData.collection,
      businessValue: formData.businessValue,
      priority: formData.priority,
      version: formData.version,
      ageRange: formData.ageRange,
      income: formData.income,
      gender: formData.gender,
      lastNotification: formData.lastNotification,
      registration: formData.registration,
      selectedTags: formData.selectedTags,
      comment: formData.comment
    }
  };
};

const transformFromNotificationRM = (notification) => {
  if (!notification) return null;
  
  return {
    id: notification.id,
    title: notification.title,
    description: notification.description,
    channel: notification.channel,
    status: notification.status,
    type: notification.type,
    shortUrl: notification.shortUrl,
    priority: notification.priority,
    contentTemplate: typeof notification.contentTemplate === 'string'
      ? {
          nudgeCardName: notification.title || '',
          title: notification.title || '',
          welcomeMessage: '',
          body: notification.description || '',
          image: '',
          callToActionLabel: '',
          type: 'INFO'
        }
      : notification.contentTemplate || {
          nudgeCardName: notification.title || '',
          title: notification.title || '',
          welcomeMessage: '',
          body: notification.description || '',
          image: '',
          callToActionLabel: '',
          type: 'INFO'
        },
    // Extract metadata fields
    collection: notification.metadata?.collection || '',
    businessValue: notification.metadata?.businessValue || '',
    priority: notification.metadata?.priority || 'NORMAL',
    version: notification.metadata?.version || '1 - Draft',
    ageRange: notification.metadata?.ageRange || { min: 18, max: 65 },
    income: notification.metadata?.income || { min: 0, max: 0 },
    gender: notification.metadata?.gender || '-1',
    lastNotification: notification.metadata?.lastNotification || { days: '' },
    registration: notification.metadata?.registration || { registeredOnly: false },
    selectedTags: notification.metadata?.selectedTags || [],
    comment: notification.metadata?.comment || ''
  };
};

// API Functions
async function fetchUsers() {
  return makeApiCall(ENDPOINTS.USERS);
}

async function fetchUser(userId) {
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

async function createUser(data) {
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

async function updateUser(userId, data) {
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

async function deleteUser(userId) {
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
async function fetchNudges(channel = 'APP_INSTANT') {
  const url = ENDPOINTS.NUDGE_ALL;
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channel })
  };

  const response = await makeApiCall(url, options);
  return response.data.map(transformFromNotificationRM);
}

async function fetchNudge(nudgeId) {
  if (!nudgeId) {
    throw new Error('Nudge ID is required');
  }

  const url = ENDPOINTS.NUDGE_BY_ID(nudgeId);
  const options = {
    headers: {
      'Accept': 'application/json'
    }
  };

  const response = await makeApiCall(url, options);
  return transformFromNotificationRM(response.data);
}

async function createNudge(data) {
  if (!data) {
    throw new Error('Nudge data is required');
  }

  const notificationRM = transformToNotificationRM(data);
  const url = ENDPOINTS.NUDGE_ALL;
  const options = {
    method: 'PUT',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([notificationRM]) // API expects an array
  };

  const response = await makeApiCall(url, options);
  return transformFromNotificationRM(response.data[0]);
}

async function updateNudge(nudgeId, data) {
  if (!nudgeId || !data) {
    throw new Error('Nudge ID and data are required');
  }

  const notificationRM = transformToNotificationRM({ ...data, id: nudgeId });
  const url = ENDPOINTS.NUDGE_BY_ID(nudgeId);
  const options = {
    method: 'PUT',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notificationRM)
  };

  const response = await makeApiCall(url, options);
  return transformFromNotificationRM(response.data);
}

async function deleteNudge(nudgeId) {
  if (!nudgeId) {
    throw new Error('Nudge ID is required');
  }

  const url = ENDPOINTS.NUDGE_BY_ID(nudgeId);
  const options = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json'
    }
  };

  return makeApiCall(url, options);
}

// Media-related API calls
async function fetchMedia(folderId = '') {
  const url = folderId ? `${ENDPOINTS.MEDIA}?folderId=${folderId}` : ENDPOINTS.MEDIA;
  return makeApiCall(url);
}

async function fetchMediaItem(mediaId) {
  if (!mediaId) {
    throw new Error('Media ID is required');
  }

  const url = `${ENDPOINTS.MEDIA}/${mediaId}`;
  return makeApiCall(url);
}

async function uploadMedia(data, folderId = '') {
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

async function updateMedia(mediaId, data) {
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

async function deleteMedia(mediaId) {
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
async function fetchFolders() {
  try {
    const { useMockData } = useConfigStore.getState();
    if (useMockData) {
      const { getAllFromStore } = await import('./storage');
      const folders = await getAllFromStore('mediaFolders');  // Updated from 'folders' to 'mediaFolders'
      return folders || [];
    }
    return makeApiCall(ENDPOINTS.FOLDERS);
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

async function fetchFolder(folderId) {
  if (!folderId) {
    throw new Error('Folder ID is required');
  }

  const url = `${ENDPOINTS.FOLDERS}/${folderId}`;
  return makeApiCall(url);
}

async function createFolder(data) {
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

async function updateFolder(folderId, data) {
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

async function deleteFolder(folderId) {
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
async function activateCampaign(campaignId) {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  const url = `${ENDPOINTS.CAMPAIGN}`;
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

async function deactivateCampaign(campaignId) {
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

async function testCampaign(campaignId) {
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

export {
  fetchUsers, fetchUser, createUser, updateUser, deleteUser,
  fetchNudges, fetchNudge, createNudge, updateNudge, deleteNudge,
  fetchMedia, fetchMediaItem, uploadMedia, updateMedia, deleteMedia,
  fetchFolders, fetchFolder, createFolder, updateFolder, deleteFolder,
  activateCampaign, deactivateCampaign, testCampaign,
  makeApiCall
};