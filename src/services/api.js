// API Base URL and endpoints
const API_BASE = 'https://backoffice-test.abaka.me';
const ENDPOINTS = {
  TOKEN: '/api/enterprise/token',
  NUDGE_ALL: '/api/studio/picks/nudge',
  NUDGE_BY_ID: (id) => `/api/nudge/notifications/${id}`, // Updated NUDGE_BY_ID endpoint
  USERS: `/api/accessmanagement/users`,
  MEDIA: `/api/studio/media`,
  FOLDERS: `/api/studio/media/folders`,
  CAMPAIGN: `/api/campaign/activate`  // Updated campaign endpoint
};

import useConfigStore from './config';
import { logger } from './utils/logging'; // Import the Logger module

// Authentication credentials
const AUTH_CREDENTIALS = {
  "AppId": "a4745b09-e957-47e1-977a-c762ada74110",
  "AppSecret": "F:CG660oWPj2lDyFjQ-tVF]v.c?oBy-g",
  "Resource": "https://backoffice-test.abaka.me"  // Add resource to match the API endpoint
};

// Auth token state
let authState = {
  token: null,
  expiresAt: null
};

// Function to clear the auth token
function clearAuthToken() {
  logger.debug('Clearing auth token');
  authState = { token: null, expiresAt: null };
}

// Function to get authentication token
async function getAuthToken() {
  const now = new Date();
  const { useMockData } = useConfigStore.getState();
  
  // Check if token exists and is not expired
  if (authState.token && authState.expiresAt && new Date(authState.expiresAt) > now) {
    return authState.token;
  }

  // Clear expired token
  authState = { token: null, expiresAt: null };

  const url = `${API_BASE}${ENDPOINTS.TOKEN}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Add MSW bypass header if not using mock data
  if (!useMockData) {
    headers['x-msw-bypass'] = 'true';
  }

  const requestOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(AUTH_CREDENTIALS)
  };

  try {
    logger.debug('Getting auth token with credentials:', { ...AUTH_CREDENTIALS, AppSecret: '[REDACTED]' });
    
    // Log the request
    await logApiRequest('POST', url, requestOptions);

    const response = await fetch(url, requestOptions);
    // Log the response
    await logApiResponse(url, response);

    const responseData = await response.clone().json().catch(() => ({}));
    logger.debug('Auth token response:', { 
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    });

    if (!response.ok) {
      throw new Error(responseData.message || `Failed to get auth token: ${response.status}`);
    }

    // Handle both string token and object with token field
    let token;
    if (typeof responseData === 'string') {
      token = responseData;
    } else if (typeof responseData === 'object' && responseData.token) {
      token = responseData.token;
    } else {
      throw new Error('Invalid token response: missing token');
    }

    // Store token with expiration
    const expiresIn = (typeof responseData === 'object' && responseData.expiresIn) || 3600; // Default to 1 hour
    authState = {
      token,
      expiresAt: new Date(now.getTime() + (expiresIn * 1000))
    };
    
    logger.info('Successfully obtained auth token, expires in:', expiresIn, 'seconds');
    return authState.token;
  } catch (error) {
    // Clear auth state on error
    authState = { token: null, expiresAt: null };
    logger.error('Failed to get auth token:', error);
    // Log the error response
    await logApiResponse(url, null, error);
    throw error;
  }
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
    const { captureResponses } = useConfigStore.getState();
    if (!captureResponses) return;

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
async function handleResponse(response, url, options, retryCount = 0) {
  const responseData = await response.json().catch(() => ({}));
  
  logger.debug('API Response:', {
    url,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData
  });

  if (!response.ok) {
    // Handle 401 by clearing token and retrying once
    if (response.status === 401 && retryCount === 0) {
      logger.info('Got 401, clearing token and retrying');
      authState = { token: null, expiresAt: null };
      const token = await getAuthToken();
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      };
      const retryResponse = await fetch(url, newOptions);
      return handleResponse(retryResponse, url, newOptions, retryCount + 1);
    }

    throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
  }
  
  return responseData;
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
  const { useMockData } = useConfigStore.getState();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = await getAuthToken();

  logger.debug('makeApiCall - Initial token:', token ? 'present' : 'missing');

  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Add MSW bypass header if not using mock data
  if (!useMockData) {
    defaultHeaders['x-msw-bypass'] = 'true';
  }

  logger.debug('makeApiCall - Default headers:', defaultHeaders);
  logger.debug('makeApiCall - Incoming options:', {
    ...options,
    body: options.body ? JSON.parse(options.body) : undefined
  });

  // First create a shallow copy of options without headers
  const { headers: optionsHeaders, ...restOptions } = options;

  // Then create requestOptions with merged headers
  const requestOptions = {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...(optionsHeaders || {})
    }
  };

  // Separate log for headers to ensure they're visible
  logger.debug('makeApiCall - Final headers:', requestOptions.headers);
  logger.debug('makeApiCall - Final request:', {
    method: requestOptions.method,
    body: requestOptions.body ? JSON.parse(requestOptions.body) : undefined
  });

  // Log the request
  await logApiRequest(requestOptions.method || 'GET', url, requestOptions);

  try {
    const response = await fetch(url, requestOptions);
    // Log response headers for debugging
    logger.debug('makeApiCall - Response headers:', Object.fromEntries(response.headers.entries()));
    // Log the response before handling it
    await logApiResponse(url, response);
    return handleResponse(response.clone(), url, requestOptions);
  } catch (error) {
    logApiResponse(url, null, error);
    throw error;
  }
}

// Helper function to determine if we should capture this response
function shouldCaptureResponse(request) {
  try {
    const url = new URL(request.url);
    
    // Capture all API requests
    return url.pathname.startsWith('/api/');
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
    body: JSON.stringify({ channel })
  };

  logger.debug('fetchNudges - Request options:', {
    ...options,
    body: JSON.parse(options.body)
  });

  const response = await makeApiCall(url, options);
  // Handle both wrapped and unwrapped responses
  const nudges = Array.isArray(response) ? response : (response.data || []);
  return nudges.map(transformFromNotificationRM);
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

async function createMedia(data) {
  const url = ENDPOINTS.MEDIA;
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
  fetchMedia, fetchMediaItem, uploadMedia, createMedia, updateMedia, deleteMedia,
  fetchFolders, fetchFolder, createFolder, updateFolder, deleteFolder,
  activateCampaign, deactivateCampaign, testCampaign,
  makeApiCall,
  clearAuthToken
};