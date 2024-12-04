import { http, HttpResponse } from 'msw';
import { getFromStore, putInStore, getAllFromStore } from '../services/storage';

// Request handlers
export const handlers = [
  // Get all nudges
  http.get('*/api/studio/picks/nudge', async () => {
    try {
      const nudges = await getAllFromStore('nudges');
      return HttpResponse.json({ data: nudges || [] });
    } catch (error) {
      console.error('[MSW] Handler error:', error);
      return HttpResponse.json(
        { message: error.message || 'Internal server error' },
        { status: error.message === 'Not found' ? 404 : 500 }
      );
    }
  }),

  // Get single nudge
  http.get('*/api/studio/picks/nudge/:nudgeId', async ({ params }) => {
    try {
      const nudge = await getFromStore('nudges', params.nudgeId);
      if (!nudge) {
        return HttpResponse.json(
          { message: 'Nudge not found' },
          { status: 404 }
        );
      }
      return HttpResponse.json({ data: nudge });
    } catch (error) {
      console.error('[MSW] Handler error:', error);
      return HttpResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }),

  // Create nudge
  http.post('*/api/studio/picks/nudge', async ({ request }) => {
    try {
      const nudge = await request.json();
      const id = crypto.randomUUID();
      const newNudge = { id, ...nudge };
      await putInStore('nudges', id, newNudge);
      return HttpResponse.json({ data: newNudge }, { status: 201 });
    } catch (error) {
      console.error('[MSW] Handler error:', error);
      return HttpResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }),

  // Update nudge
  http.put('*/api/studio/picks/nudge/:nudgeId', async ({ params, request }) => {
    try {
      const updates = await request.json();
      const existingNudge = await getFromStore('nudges', params.nudgeId);
      
      if (!existingNudge) {
        return HttpResponse.json(
          { message: 'Nudge not found' },
          { status: 404 }
        );
      }

      const updatedNudge = { ...existingNudge, ...updates };
      await putInStore('nudges', params.nudgeId, updatedNudge);
      return HttpResponse.json({ data: updatedNudge });
    } catch (error) {
      console.error('[MSW] Handler error:', error);
      return HttpResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  })
];