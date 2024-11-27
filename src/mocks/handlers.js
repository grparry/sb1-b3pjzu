import { getFromStore, putInStore } from '../services/storage';

// Helper to create JSON response with proper headers
const createResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  });
};

// Request handlers
export const handlers = [
  {
    name: 'getNudge',
    test: (pathname, request) => {
      if (request.method !== 'GET') return null;
      const match = pathname.match(/^\/api\/studio\/picks\/nudge\/([^\/]+)$/);
      return match ? { nudgeId: match[1] } : null;
    },
    async resolver(request, { nudgeId }) {
      console.log('Getting nudge:', nudgeId);
      try {
        const nudge = await getFromStore('nudges', nudgeId);
        if (!nudge) {
          return createResponse({ message: 'Nudge not found' }, 404);
        }
        return createResponse(nudge);
      } catch (error) {
        console.error('Handler error:', error);
        return createResponse(
          { message: error.message || 'Internal server error' },
          error.message === 'Not found' ? 404 : 500
        );
      }
    }
  },

  {
    name: 'createNudge',
    test: (pathname, request) => 
      request.method === 'POST' && pathname === '/api/studio/picks/nudge',
    async resolver(request) {
      try {
        const nudge = await request.json();
        const id = crypto.randomUUID();
        const newNudge = { id, ...nudge };
        
        await putInStore('nudges', newNudge);
        return createResponse(newNudge, 201);
      } catch (error) {
        console.error('Handler error:', error);
        return createResponse(
          { message: error.message || 'Internal server error' },
          500
        );
      }
    }
  },

  {
    name: 'updateNudge',
    test: (pathname, request) => {
      if (request.method !== 'PUT') return null;
      const match = pathname.match(/^\/api\/studio\/picks\/nudge\/([^\/]+)$/);
      return match ? { nudgeId: match[1] } : null;
    },
    async resolver(request, { nudgeId }) {
      try {
        const updateData = await request.json();
        const existingNudge = await getFromStore('nudges', nudgeId);
        
        if (!existingNudge) {
          return createResponse({ message: 'Nudge not found' }, 404);
        }
        
        const updatedNudge = { ...existingNudge, ...updateData, id: nudgeId };
        await putInStore('nudges', updatedNudge);
        return createResponse(updatedNudge);
      } catch (error) {
        console.error('Handler error:', error);
        return createResponse(
          { message: error.message || 'Internal server error' },
          500
        );
      }
    }
  }
];