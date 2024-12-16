// Utility function to make direct API calls without MSW interference
export async function directFetch(url, options = {}) {
  // Temporarily disable MSW
  if (window.msw?.worker?.stop) {
    await window.msw.worker.stop();
  }

  try {
    // Make the actual fetch call
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit'
    });
    return response;
  } finally {
    // Re-enable MSW
    if (window.msw?.worker?.start) {
      await window.msw.worker.start();
    }
  }
}
