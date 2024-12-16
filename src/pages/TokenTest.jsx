import React, { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { logger } from '../services/utils/logging';

function TokenTest() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestLog, setRequestLog] = useState(null);
  const [responseLog, setResponseLog] = useState(null);

  const testTokenEndpoint = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setRequestLog(null);
    setResponseLog(null);

    const url = '/api/enterprise/token';
    const requestBody = {
      AppId: "a4745b09-e957-47e1-977a-c762ada74110",
      AppSecret: "F:CG660oWPj2lDyFjQ-tVF]v.c?oBy-g"
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-msw-bypass': 'true'  // Add bypass header to skip MSW
    };

    try {
      // Log request details
      const requestDetails = {
        url,
        method: 'POST',
        headers,
        body: requestBody
      };
      logger.info('Token request details', requestDetails);
      setRequestLog(requestDetails);

      const startTime = performance.now();
      
      // Log the exact request body being sent
      const requestBodyStr = JSON.stringify(requestBody);
      logger.debug('Request body string', requestBodyStr);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBodyStr
      });

      const endTime = performance.now();

      // Get response body even if status is not ok
      let responseBody;
      const responseText = await response.text();
      logger.debug('Raw response text', responseText);
      
      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        responseBody = { text: responseText };
      }

      // Log response details
      const responseDetails = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timing: `${Math.round(endTime - startTime)}ms`,
        body: responseBody
      };
      logger.info('Token response details', responseDetails);
      setResponseLog(responseDetails);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\nResponse: ${JSON.stringify(responseBody, null, 2)}`);
      }

      setResponse(responseBody);

    } catch (err) {
      logger.error('Token test error', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Breadcrumb items={[{ label: 'Token Test' }]} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Enterprise Token Endpoint Tester</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                This is a direct test of the enterprise token endpoint.
              </p>
            </div>

            <button 
              onClick={testTokenEndpoint}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Token Endpoint'}
            </button>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded">
                <h3 className="font-bold">Error</h3>
                <pre className="whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            )}

            {requestLog && (
              <div className="p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Request Details</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(requestLog, null, 2)}
                </pre>
              </div>
            )}

            {responseLog && (
              <div className="p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Response Details</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(responseLog, null, 2)}
                </pre>
              </div>
            )}

            {response && (
              <div className="p-4 bg-green-100 rounded">
                <h3 className="font-bold mb-2">Response</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenTest;
