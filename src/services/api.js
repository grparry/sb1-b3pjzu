// API Base URL and endpoints
const API_BASE = '';  // Empty base for MSW to work properly
const ENDPOINTS = {
  NUDGE: `/api/studio/picks/nudge`  // Keep base endpoint without trailing slash
};

// Helper function to log API requests
async function logApiRequest(method, url, options = {}) {
  try {
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
    const { logNetwork } = await import('./storage');
    const responseData = {
      type: error ? 'error' : 'success',
      operation: {
        type: 'response',
        url,
        status: response?.status,
        statusText: response?.statusText,
        headers: response ? Object.fromEntries(response.headers.entries()) : undefined,
        timestamp: new Date().toISOString()
      }
    };

    if (error) {
      responseData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (response) {
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const clonedResponse = response.clone();
          const body = await clonedResponse.json();
          responseData.operation.body = body;
        }
      } catch (err) {
        console.warn('Could not parse response body:', err);
      }
    }

    await logNetwork(responseData);
  } catch (err) {
    console.error('Failed to log API response:', err);
  }
}

// Helper function to handle API responses
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage;
    try {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || response.statusText;
      } else {
        errorMessage = response.statusText;
      }
    } catch (parseError) {
      console.error('Response parsing error:', parseError);
      errorMessage = response.statusText;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }
  
  if (response.status === 204) {
    return null;
  }

  if (!contentType?.includes('application/json')) {
    throw new Error('Invalid response format: Expected JSON');
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Failed to parse JSON response');
  }
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

  await logApiRequest('GET', url, options);

  try {
    const response = await fetch(url, options);
    await logApiResponse(url, response);
    
    const data = await handleResponse(response);
    if (!data) {
      throw new Error('Nudge not found');
    }
    return data;
  } catch (error) {
    console.error('Error fetching nudge:', error);
    await logApiResponse(url, null, error);
    throw error;
  }
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

  await logApiRequest('POST', url, options);

  try {
    const response = await fetch(url, options);
    await logApiResponse(url, response);
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating nudge:', error);
    await logApiResponse(url, null, error);
    throw error;
  }
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

  await logApiRequest('PUT', url, options);

  try {
    const response = await fetch(url, options);
    await logApiResponse(url, response);
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating nudge:', error);
    await logApiResponse(url, null, error);
    throw error;
  }
}