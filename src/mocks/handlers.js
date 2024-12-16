import { http, HttpResponse, passthrough } from 'msw';
import { getFromStore, putInStore, getAllFromStore, deleteRecord, getDB } from '../services/storage';
import { logger } from '../services/utils/logging';
import useConfigStore from '../services/config';
import { InitializationManager } from '../utils/initialization/InitializationManager';

// Helper to get stack trace
const getStackTrace = () => {
  try {
    throw new Error('Stack trace');
  } catch (error) {
    return error.stack;
  }
};

// Helper to capture response
const captureResponse = async (url, response) => {
  const { captureResponses } = useConfigStore.getState();
  if (!captureResponses) return;

  try {
    const { logNetwork } = await import('../services/storage/networkLogs');
    const responseData = {
      type: 'success',
      operation: {
        type: 'response',
        url,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        timestamp: new Date().toISOString(),
        response: response
      }
    };
    await logNetwork(responseData);
  } catch (error) {
    console.error('Failed to capture MSW response:', error);
  }
};

// Helper to check if request should bypass MSW
const shouldBypassMSW = (request) => {
  const { useMockData } = useConfigStore.getState();
  return !useMockData || request.headers.get('x-msw-bypass') === 'true';
};

// Helper to check if database is initialized
const checkInitialized = async () => {
  try {
    const { isIndexedDBAvailable } = await import('../services/storage/core');
    if (!isIndexedDBAvailable()) {
      logger.warn('MSW', 'IndexedDB is not available');
      return false;
    }
    const db = await getDB();
    return !!db;
  } catch (error) {
    logger.warn('MSW', 'Database not initialized yet', error);
    return false;
  }
};

// Get API base URL from config
const getApiBaseUrl = () => {
  const { apiBaseUrl } = useConfigStore.getState();
  return apiBaseUrl || 'https://backoffice-test.abaka.me';
};

const API_BASE = getApiBaseUrl();

// Request handlers
export const handlers = [
  // Get auth token
  http.post(`${API_BASE}/api/enterprise/token`, async ({ request }) => {
    try {
      logger.info('MSW intercepting token request');
      logger.debug('Request details:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      const body = await request.json();
      logger.debug('Request body:', body);
      
      // Verify credentials
      if (
        body.AppId === 'a4745b09-e957-47e1-977a-c762ada74110' && 
        body.AppSecret === 'F:CG660oWPj2lDyFjQ-tVF]v.c?oBy-g'
      ) {
        const response = {
          token: 'mock-token-' + Date.now(),
          expiresIn: 3600
        };
        logger.info('MSW returning mock token');
        await captureResponse(request.url, response);
        return HttpResponse.json(response);
      } else {
        logger.warn('MSW invalid credentials');
        return new HttpResponse(null, {
          status: 401,
          statusText: 'Unauthorized'
        });
      }
    } catch (error) {
      logger.error('MSW token handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      return new HttpResponse(null, { 
        status: 500,
        statusText: 'Internal Server Error'
      });
    }
  }),

  // Get single nudge
  http.get(`${API_BASE}/api/nudge/notifications/:nudgeId`, async ({ params, request }) => {
    try {
      logger.info('MSW intercepting nudge request');
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { nudgeId } = params;
      const nudges = await getAllFromStore('nudges');
      const nudge = nudges?.find(n => n.id === nudgeId);
      
      if (!nudge) {
        logger.warn('MSW nudge not found');
        const response = { message: 'Nudge not found' };
        await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      logger.info('MSW returning mock nudge');
      const response = { data: nudge };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW nudge handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${params.nudgeId}`, response);
      return HttpResponse.json(response, { status: error.message === 'Not found' ? 404 : 500 });
    }
  }),

  // Get all notifications
  http.post(`${API_BASE}/api/nudge/notification/all`, async ({ request }) => {
    try {
      logger.info('MSW intercepting all notifications request');
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const nudges = await getAllFromStore('nudges');
      logger.info('MSW returning mock nudges:', nudges?.length || 0);
      const response = nudges || [];
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW all nudges handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Update notifications
  http.put(`${API_BASE}/api/nudge/notification/all`, async ({ request }) => {
    try {
      logger.info('MSW intercepting update notifications request');
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      
      const nudges = await request.json();
      await putInStore('nudges', nudges);
      
      logger.info('MSW updated notifications');
      return HttpResponse.json({ status: 'success' });
    } catch (error) {
      logger.error('MSW update notifications handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      return HttpResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
  }),

  // Get all nudges
  http.get(`${API_BASE}/api/studio/picks/nudge`, async ({ request }) => {
    try {
      logger.info('MSW intercepting all nudges request');
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      // Check initialization
      if (!await checkInitialized()) {
        const error = { message: 'Database not initialized' };
        await captureResponse(`${API_BASE}/api/studio/picks/nudge`, error);
        return HttpResponse.json(error, { status: 503 });
      }

      // Get nudges from store only
      const nudges = await getAllFromStore('nudges');
      if (!nudges) {
        logger.warn('No nudges found in database');
        return HttpResponse.json([], { status: 200 });
      }

      logger.info('MSW returning nudges:', nudges.length);
      await captureResponse(`${API_BASE}/api/studio/picks/nudge`, nudges);
      return HttpResponse.json(nudges);
    } catch (error) {
      logger.error('MSW all nudges handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/picks/nudge`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Get all nudges (POST)
  http.post(`${API_BASE}/api/studio/picks/nudge`, async ({ request }) => {
    try {
      logger.info('MSW intercepting all nudges request');
      
      // Check for bypass
      if (shouldBypassMSW(request)) {
        logger.info('MSW bypass requested, passing through');
        return passthrough();
      }

      // Check initialization
      if (!await checkInitialized()) {
        const error = { message: 'Database not initialized' };
        await captureResponse(request.url, error);
        return HttpResponse.json(error, { status: 503 });
      }

      // Get nudges from store only
      const nudges = await getAllFromStore('nudges');
      if (!nudges) {
        logger.warn('No nudges found in database');
        return HttpResponse.json([], { status: 200 });
      }

      logger.info('MSW returning nudges:', nudges.length);
      await captureResponse(request.url, nudges);
      return HttpResponse.json(nudges);
    } catch (error) {
      logger.error('MSW all nudges handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Create nudge
  http.put(`${API_BASE}/api/studio/picks/nudge`, async ({ request }) => {
    try {
      logger.info('MSW intercepting create nudge request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const [nudgeData] = await request.json(); // API expects an array with one nudge
      
      // Generate a new ID for the nudge based on its title
      const generateNudgeId = (title) => {
        const baseId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `nudge-${baseId}`;
      };
      
      // Get current nudges to maintain the list
      const nudges = await getAllFromStore('nudges') || [];
      
      // Generate a unique ID based on the title
      let newId = generateNudgeId(nudgeData.title);
      let counter = 1;
      while (nudges.some(n => n.id === newId)) {
        newId = `${generateNudgeId(nudgeData.title)}-${counter}`;
        counter++;
      }
      
      const newNudge = {
        ...nudgeData,
        id: newId
      };
      
      // Add the new nudge to the list
      const updatedNudges = [...nudges, newNudge];
      
      // Store each nudge individually
      for (const nudge of updatedNudges) {
        await putInStore('nudges', nudge);
      }
      
      logger.info('MSW created new nudge:', newNudge.id);
      const response = { data: [newNudge] };
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW create nudge handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Update nudge
  http.put(`${API_BASE}/api/nudge/notifications/:nudgeId`, async ({ params, request }) => {
    try {
      logger.info('MSW intercepting update nudge request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { nudgeId } = params;
      const nudgeData = await request.json();
      
      // Get current nudges
      const nudges = await getAllFromStore('nudges') || [];
      const existingNudge = nudges.find(n => n.id === nudgeId);
      
      if (!existingNudge) {
        logger.warn('MSW nudge not found for update:', nudgeId);
        const response = { message: 'Nudge not found' };
        await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      // Create updated nudge
      const updatedNudge = {
        ...existingNudge,
        ...nudgeData,
        id: nudgeId // Ensure ID is preserved
      };
      
      // Update the nudges list
      const updatedNudges = nudges.map(n => n.id === nudgeId ? updatedNudge : n);
      
      // Store each nudge individually
      for (const nudge of updatedNudges) {
        await putInStore('nudges', nudge);
      }
      
      logger.info('MSW updated nudge:', nudgeId);
      const response = { data: updatedNudge };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW update nudge handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${params.nudgeId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Delete nudge
  http.delete(`${API_BASE}/api/nudge/notifications/:nudgeId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting delete nudge request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { nudgeId } = params;
      
      // Get current nudges
      const nudges = await getAllFromStore('nudges') || [];
      const existingNudge = nudges.find(n => n.id === nudgeId);
      
      if (!existingNudge) {
        logger.warn('MSW nudge not found for deletion:', nudgeId);
        const response = { message: 'Nudge not found' };
        await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      // Update the nudges list
      const updatedNudges = nudges.filter(n => n.id !== nudgeId);
      
      // Clear existing nudges and store updated list
      for (const nudge of updatedNudges) {
        await putInStore('nudges', nudge);
      }
      
      logger.info('MSW deleted nudge:', nudgeId);
      const response = { success: true };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${nudgeId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW delete nudge handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/nudge/notifications/${params.nudgeId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Users endpoints
  http.get(`${API_BASE}/api/accessmanagement/users`, async () => {
    try {
      logger.info('MSW intercepting users request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const users = await getAllFromStore('users') || [];
      const response = users;
      await captureResponse(`${API_BASE}/api/accessmanagement/users`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW users handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/accessmanagement/users`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.get(`${API_BASE}/api/accessmanagement/users/:userId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting user request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { userId } = params;
      const users = await getAllFromStore('users') || [];
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        const response = { message: 'User not found' };
        await captureResponse(`${API_BASE}/api/accessmanagement/users/${userId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      const response = user;
      await captureResponse(`${API_BASE}/api/accessmanagement/users/${userId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW user handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/accessmanagement/users/${params.userId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Media endpoints
  http.get(`${API_BASE}/api/studio/media`, async ({ request }) => {
    try {
      logger.info('MSW intercepting media request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const url = new URL(request.url);
      const folderId = url.searchParams.get('folderId') || '';
      const media = await getAllFromStore('media') || [];
      
      const filteredMedia = folderId 
        ? media.filter(m => m.folderId === folderId)
        : media;
      
      const response = filteredMedia;
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.get(`${API_BASE}/api/studio/media/:mediaId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting media item request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { mediaId } = params;
      const media = await getAllFromStore('media') || [];
      const item = media.find(m => m.id === mediaId);
      
      if (!item) {
        const response = { message: 'Media item not found' };
        await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      const response = item;
      await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media item handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/${params.mediaId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Get all media
  http.get(`${API_BASE}/api/studio/media`, async ({ request }) => {
    try {
      logger.info('MSW intercepting media request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const url = new URL(request.url);
      const folderId = url.searchParams.get('folderId');
      
      const media = await getAllFromStore('media') || [];
      
      // Filter by folder if folderId is provided
      const filteredMedia = folderId 
        ? media.filter(item => item.folderId === folderId)
        : media;
      
      const response = filteredMedia;
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.get(`${API_BASE}/api/studio/media/:mediaId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting media item request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { mediaId } = params;
      const media = await getFromStore('media', mediaId);
      
      if (!media) {
        const response = { message: 'Media not found' };
        await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      const response = media;
      await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media item handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/${params.mediaId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Upload media
  http.post(`${API_BASE}/api/studio/media`, async ({ request }) => {
    try {
      logger.info('MSW intercepting media upload request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      
      const mediaData = await request.json();

      if (!mediaData || !mediaData.name) {
        const response = { message: 'Invalid media data provided' };
        await captureResponse(request.url, response);
        return HttpResponse.json(response, { status: 400 });
      }

      // Get all existing media to determine next ID
      const existingMedia = await getAllFromStore('media') || [];
      const maxId = existingMedia.reduce((max, item) => {
        const id = parseInt(item.id, 10);
        return isNaN(id) ? max : Math.max(max, id);
      }, 0);
      const nextId = (maxId + 1).toString();

      // Create a new media item
      const newMedia = {
        id: nextId,
        name: mediaData.name,
        type: mediaData.type || 'landing',
        content: mediaData.content || '',
        status: mediaData.status || 'draft',
        url: mediaData.url || '',
        folderId: mediaData.folderId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await putInStore('media', newMedia);
      logger.info('MSW created new media:', newMedia.id);
      const response = newMedia;
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media upload handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Update media
  http.put(`${API_BASE}/api/studio/media/:mediaId`, async ({ params, request }) => {
    try {
      logger.info('MSW intercepting media update request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { mediaId } = params;
      const mediaData = await request.json();
      const media = await getFromStore('media', mediaId);
      
      if (!media) {
        const response = { message: 'Media not found' };
        await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      // Update the media item
      const updatedMedia = {
        ...media,
        ...mediaData,
        id: mediaId, // Ensure ID is preserved
        updatedAt: new Date().toISOString()
      };
      
      await putInStore('media', updatedMedia);
      logger.info('MSW updated media:', mediaId);
      const response = updatedMedia;
      await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media update handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/${params.mediaId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Delete media
  http.delete(`${API_BASE}/api/studio/media/:mediaId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting media delete request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { mediaId } = params;
      const media = await getFromStore('media', mediaId);
      
      if (!media) {
        const response = { message: 'Media not found' };
        await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      await deleteRecord('media', mediaId);
      logger.info('MSW deleted media:', mediaId);
      const response = { success: true };
      await captureResponse(`${API_BASE}/api/studio/media/${mediaId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW media delete handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/${params.mediaId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Folders endpoints
  http.get(`${API_BASE}/api/studio/media/folders`, async () => {
    try {
      logger.info('MSW intercepting folders request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const folders = await getAllFromStore('mediaFolders') || [];
      const response = folders;
      await captureResponse(`${API_BASE}/api/studio/media/folders`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW folders handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/folders`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.get(`${API_BASE}/api/studio/media/folders/:folderId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting folder request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { folderId } = params;
      const folders = await getAllFromStore('mediaFolders') || [];
      const folder = folders.find(f => f.id === folderId);
      
      if (!folder) {
        const response = { message: 'Folder not found' };
        await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      const response = folder;
      await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW folder handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/folders/${params.folderId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Create folder
  http.post(`${API_BASE}/api/studio/media/folders`, async ({ request }) => {
    try {
      logger.info('MSW intercepting create folder request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const folderData = await request.json();
      
      // Generate a unique ID for the new folder
      const newFolder = {
        ...folderData,
        id: `folder-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store the new folder as a single record
      await putInStore('mediaFolders', newFolder);
      
      logger.info('MSW created new folder:', newFolder.id);
      const response = newFolder;
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW create folder handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Update folder
  http.put(`${API_BASE}/api/studio/media/folders/:folderId`, async ({ params, request }) => {
    try {
      logger.info('MSW intercepting update folder request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { folderId } = params;
      const folderData = await request.json();
      const folder = await getFromStore('mediaFolders', folderId);
      
      if (!folder) {
        const response = { message: 'Folder not found' };
        await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      // Update the folder
      const updatedFolder = {
        ...folder,
        ...folderData,
        id: folderId, // Ensure ID is preserved
        updatedAt: new Date().toISOString()
      };
      
      await putInStore('mediaFolders', updatedFolder);
      logger.info('MSW updated folder:', folderId);
      const response = updatedFolder;
      await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW update folder handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/folders/${params.folderId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Delete folder
  http.delete(`${API_BASE}/api/studio/media/folders/:folderId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting delete folder request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { folderId } = params;
      const folder = await getFromStore('mediaFolders', folderId);
      
      if (!folder) {
        const response = { message: 'Folder not found' };
        await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      await deleteRecord('mediaFolders', folderId);
      logger.info('MSW deleted folder:', folderId);
      const response = { success: true };
      await captureResponse(`${API_BASE}/api/studio/media/folders/${folderId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW delete folder handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/media/folders/${params.folderId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Campaign endpoints
  http.post(`${API_BASE}/api/campaign/activate/:campaignId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting campaign activation request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { campaignId } = params;
      const campaigns = await getAllFromStore('campaigns') || [];
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        const response = { message: 'Campaign not found' };
        await captureResponse(`${API_BASE}/api/campaign/activate/${campaignId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      campaign.status = 'ACTIVE';
      await putInStore('campaigns', campaigns);
      
      const response = { success: true };
      await captureResponse(`${API_BASE}/api/campaign/activate/${campaignId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW campaign activation handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/campaign/activate/${params.campaignId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.post(`${API_BASE}/api/campaign/deactivate/:campaignId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting campaign deactivation request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { campaignId } = params;
      const campaigns = await getAllFromStore('campaigns') || [];
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        const response = { message: 'Campaign not found' };
        await captureResponse(`${API_BASE}/api/campaign/deactivate/${campaignId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      campaign.status = 'INACTIVE';
      await putInStore('campaigns', campaigns);
      
      const response = { success: true };
      await captureResponse(`${API_BASE}/api/campaign/deactivate/${campaignId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW campaign deactivation handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/campaign/deactivate/${params.campaignId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.post(`${API_BASE}/api/campaign/test/:campaignId`, async ({ params }) => {
    try {
      logger.info('MSW intercepting campaign test request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const { campaignId } = params;
      const campaigns = await getAllFromStore('campaigns') || [];
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        const response = { message: 'Campaign not found' };
        await captureResponse(`${API_BASE}/api/campaign/test/${campaignId}`, response);
        return HttpResponse.json(response, { status: 404 });
      }
      
      const response = { success: true, testResult: 'Test completed successfully' };
      await captureResponse(`${API_BASE}/api/campaign/test/${campaignId}`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW campaign test handler error:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/campaign/test/${params.campaignId}`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Handle nudge endpoints
  http.get(`${API_BASE}/api/studio/picks/nudge`, async () => {
    try {
      logger.info('MSW intercepting nudge request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const nudges = await getAllFromStore('nudges');
      const response = nudges || [];
      await captureResponse(`${API_BASE}/api/studio/picks/nudge`, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('Error getting nudges:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(`${API_BASE}/api/studio/picks/nudge`, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  http.post(`${API_BASE}/api/studio/picks/nudge`, async ({ request }) => {
    try {
      logger.info('MSW intercepting nudge request');
      if (!await checkInitialized()) {
        return HttpResponse.json([]);
      }
      const nudge = await request.json();
      await putInStore('nudges', nudge);
      const response = nudge;
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('Error creating nudge:', error);
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  }),

  // Catch-all handler for unhandled requests
  http.all(`${API_BASE}/api/*`, async ({ request }) => {
    try {
      logger.info('MSW intercepting generic request');
      logger.debug('Request details:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });
      
      // Return a default success response
      const response = { message: 'Mock response from catch-all handler' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response);
    } catch (error) {
      logger.error('MSW generic handler error:', error);
      logger.error('Stack trace:', getStackTrace());
      const response = { message: error.message || 'Internal server error' };
      await captureResponse(request.url, response);
      return HttpResponse.json(response, { status: 500 });
    }
  })
];