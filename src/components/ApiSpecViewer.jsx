import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, Play, Search, Plus, Trash2 } from 'lucide-react';
import { makeApiCall } from '../services/api';

function ApiSpecViewer({ isOpen, onClose, apiSpec }) {
  if (!apiSpec) return null;

  // Utility functions
  const extractRef = useCallback((ref) => {
    if (!ref) return null;
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }, []);

  const getReferencedSchema = useCallback((ref) => {
    if (!ref || !apiSpec) return null;
    const schemaName = extractRef(ref);
    return apiSpec.content.components?.schemas?.[schemaName] || apiSpec.content.definitions?.[schemaName];
  }, [apiSpec, extractRef]);

  const getResourceType = useCallback((path) => {
    const parts = path.split('/').filter(Boolean);
    const startIndex = parts[0] === 'api' ? 1 : 0;
    return parts[startIndex] || 'other';
  }, []);

  // State management
  const [expandedResources, setExpandedResources] = useState(new Set());
  const [expandedEndpoints, setExpandedEndpoints] = useState(new Set());
  const [expandedModels, setExpandedModels] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingItems, setMatchingItems] = useState(new Set());
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [testRequest, setTestRequest] = useState({
    queryParams: {},
    headers: {},
    body: '',
    response: null,
    isLoading: false,
    error: null
  });

  // New state for header input fields
  const [newHeader, setNewHeader] = useState({ key: '', value: '' });

  // Function to add a new header
  const addHeader = () => {
    if (newHeader.key && newHeader.value) {
      setTestRequest(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeader.key]: newHeader.value
        }
      }));
      setNewHeader({ key: '', value: '' }); // Reset input fields
    }
  };

  // Format JSON with proper indentation
  const formatJson = (json) => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  // Function to calculate Content-Length
  const calculateContentLength = useCallback((body) => {
    if (!body) return '0';
    const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body);
    const length = new TextEncoder().encode(bodyStr).length.toString();
    console.log('Calculated Content-Length:', length, 'for body:', bodyStr);
    return length;
  }, []);

  // Function to get host from URL
  const getHost = useCallback((url) => {
    try {
      const urlObj = new URL(url);
      const host = urlObj.host;
      console.log('Calculated Host:', host, 'for URL:', url);
      return host;
    } catch {
      const defaultHost = window.location.host;
      console.log('Using default Host:', defaultHost);
      return defaultHost;
    }
  }, []);

  // Get default headers for request
  const getDefaultHeaders = useCallback(() => {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-msw-bypass': 'true'  // Include MSW bypass by default for consistent behavior
    };
  }, []);

  // Handle test request execution
  const handleTestRequest = async () => {
    setTestRequest(prev => ({ ...prev, isLoading: true, error: null, response: null }));
    
    try {
      // Build URL with query parameters
      const queryString = Object.entries(testRequest.queryParams)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      const url = `${selectedEndpoint.path}${queryString ? `?${queryString}` : ''}`;
      console.log('API Request Details:', {
        url,
        method: selectedEndpoint.method.toUpperCase(),
        rawBody: testRequest.body,
        bodyType: typeof testRequest.body,
        bodyLength: testRequest.body?.length
      });

      // Special handling for token endpoint
      const isTokenEndpoint = url === '/api/enterprise/token';
      
      if (isTokenEndpoint) {
        // Use the same approach as TokenTest component
        const tokenHeaders = getDefaultHeaders();
        const response = await fetch(url, {
          method: 'POST',
          headers: tokenHeaders,
          body: testRequest.body
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          responseData = { text: responseText };
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}`);
        }

        setTestRequest(prev => ({
          ...prev,
          isLoading: false,
          response: JSON.stringify(responseData, null, 2)
        }));
        return;
      }

      // Calculate Content-Length from the actual body
      const contentLength = testRequest.body ? new TextEncoder().encode(testRequest.body).length.toString() : '0';
      
      // Build request options with all necessary headers
      const options = {
        method: selectedEndpoint.method.toUpperCase(),
        headers: {
          ...getDefaultHeaders(),
          'Content-Length': contentLength,
          ...testRequest.headers
        }
      };

      // Add body if present
      if (testRequest.body) {
        options.body = testRequest.body;
      }

      console.log('Final request configuration:', {
        url,
        method: options.method,
        headers: options.headers,
        body: options.body
      });

      // Import storage functions and check mock mode
      const { putInStore } = await import('../services/storage');
      const { useMockApi } = await import('../services/config').then(m => m.default.getState());

      let response, responseData;

      if (useMockApi) {
        response = await fetch(url, options);
        responseData = await response.json();

        // Store successful responses in IndexedDB
        if (response.ok) {
          const storeName = selectedEndpoint.path.split('/')[2] || 'mockResponses';
          await putInStore(storeName, responseData);
          console.log(`Stored mock response in ${storeName} store:`, responseData);
        }
      } else {
        // In real API mode, use makeApiCall which handles authentication
        // Pass the full URL and options directly to makeApiCall
        responseData = await makeApiCall(url, options);
        response = { ok: true }; // makeApiCall throws on error
      }

      setTestRequest(prev => ({
        ...prev,
        isLoading: false,
        response: JSON.stringify(responseData, null, 2)
      }));
    } catch (error) {
      console.error('Test request error:', error);
      setTestRequest(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Helper function to generate mock value based on type and format
  const generateMockValue = (schema, path = '') => {
    console.log('generateMockValue called with schema:', schema, 'and path:', path);
    if (!schema) {
      console.log('Schema is null or undefined');
      return null;
    }

    // Special case for token endpoint credentials
    if (path.toLowerCase().includes('appid')) {
      return "a4745b09-e957-47e1-977a-c762ada74110";
    }
    if (path.toLowerCase().includes('appsecret')) {
      return "F:CG660oWPj2lDyFjQ-tVF]v.c?oBy-g";
    }

    // If schema has a reference, resolve it
    if (schema.$ref) {
      console.log('Schema has a reference:', schema.$ref);
      const refPath = schema.$ref.split('/').pop(); // Get the last part of the reference
      const resolvedSchema = apiSpec?.content?.components?.schemas?.[refPath] || 
                             apiSpec?.content?.definitions?.[refPath];
      if (resolvedSchema) {
        console.log('Resolved schema:', resolvedSchema);
        return generateMockValue(resolvedSchema, path);
      } else {
        console.log('Could not resolve schema reference:', schema.$ref);
        return null;
      }
    }

    // Handle if schema is an array directly
    if (Array.isArray(schema)) {
      console.log('Schema is an array');
      return schema.map(item => generateMockValue(item, path));
    }

    switch (schema.type) {
      case 'string':
        console.log('Generating mock string value');
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
        if (schema.enum) return schema.enum[0];
        // Generate meaningful mock data based on property name
        if (path.toLowerCase().includes('name')) return 'John Doe';
        if (path.toLowerCase().includes('email')) return 'user@example.com';
        if (path.toLowerCase().includes('phone')) return '555-0123';
        if (path.toLowerCase().includes('description')) return 'Sample description';
        return 'sample string';
      
      case 'number':
      case 'integer':
        console.log('Generating mock number value');
        if (schema.format === 'int64') return 1000;
        if (path.toLowerCase().includes('age')) return 25;
        if (path.toLowerCase().includes('year')) return new Date().getFullYear();
        if (path.toLowerCase().includes('count')) return 42;
        return 0;
      
      case 'boolean':
        console.log('Generating mock boolean value');
        return true;
      
      case 'array':
        console.log('Generating mock array value');
        if (schema.items) {
          // Generate 2 items for better visualization
          return [
            generateMockValue(schema.items, path),
            generateMockValue(schema.items, path)
          ];
        }
        return [];
      
      case 'object':
        console.log('Generating mock object value');
        if (schema.properties) {
          const mockObj = {};
          Object.entries(schema.properties).forEach(([key, prop]) => {
            try {
              mockObj[key] = generateMockValue(prop, `${path}.${key}`);
            } catch (error) {
              console.error(`Error generating mock value for property ${key}:`, error);
              mockObj[key] = null;
            }
          });
          return mockObj;
        }
        return {};
      
      default:
        console.log('Generating mock value for unknown type:', schema.type);
        // Handle oneOf, anyOf, allOf
        if (schema.oneOf) return generateMockValue(schema.oneOf[0], path);
        if (schema.anyOf) return generateMockValue(schema.anyOf[0], path);
        if (schema.allOf) {
          return schema.allOf.reduce((acc, subSchema) => ({
            ...acc,
            ...generateMockValue(subSchema, path)
          }), {});
        }
        return null;
    }
  };

  // Function to generate mock request body based on endpoint schema
  const generateMockRequestBody = (endpoint) => {
    console.log('generateMockRequestBody called with endpoint:', endpoint);
    console.log('Current apiSpec:', apiSpec);

    if (!endpoint) {
      console.log('No endpoint provided');
      return '';
    }

    try {
      // Get the path object from the OpenAPI spec
      const pathObj = apiSpec?.content?.paths?.[endpoint.path];
      console.log('Found pathObj:', pathObj);
      
      if (!pathObj) {
        console.log('No path object found for:', endpoint.path);
        return '';
      }

      // Get the operation object
      const operation = pathObj[endpoint.method.toLowerCase()];
      console.log('Found operation:', operation);
      
      if (!operation) {
        console.log('No operation found for method:', endpoint.method);
        return '';
      }

      // First try modern OpenAPI requestBody
      const requestBody = operation.requestBody;
      console.log('Found requestBody:', requestBody);
      
      if (requestBody?.content?.['application/json']?.schema) {
        const schema = requestBody.content['application/json'].schema;
        console.log('Found modern schema:', schema);
        const mockData = generateMockValue(schema);
        return mockData ? JSON.stringify(mockData, null, 2) : '';
      }

      // If no requestBody, try parameters (OpenAPI 2.0 / Swagger)
      console.log('Checking for body parameter in parameters');
      const bodyParam = operation.parameters?.find(p => p.in === 'body');
      if (bodyParam?.schema) {
        console.log('Found body parameter schema:', bodyParam.schema);
        const mockData = generateMockValue(bodyParam.schema);
        return mockData ? JSON.stringify(mockData, null, 2) : '';
      }

      // If still no schema found, try to construct from non-body parameters
      console.log('Constructing mock from parameters');
      const mockObj = {};
      operation.parameters?.forEach(param => {
        if (param.in === 'query' || param.in === 'formData') {
          mockObj[param.name] = generateMockValue({ 
            type: param.type || 'string',
            format: param.format,
            enum: param.enum
          }, param.name);
        }
      });

      return Object.keys(mockObj).length > 0 ? JSON.stringify(mockObj, null, 2) : '';

    } catch (error) {
      console.error('Error generating mock request body:', error);
      return '';
    }
  };

  // Function to handle endpoint selection
  const handleEndpointSelect = (endpoint, method) => {
    setSelectedEndpoint({ ...endpoint, method });
    setIsTestDrawerOpen(true);
    
    // Reset test request state with mock data
    setTestRequest(prev => ({
      ...prev,
      queryParams: {},
      headers: {},
      body: generateMockRequestBody({ ...endpoint, method }),
      response: null,
      error: null
    }));
  };

  // Group endpoints and collect their models
  const { groups, modelsByGroup } = React.useMemo(() => {
    if (!apiSpec?.content?.paths) return { groups: new Map(), modelsByGroup: new Map() };
    
    const groups = new Map();
    const modelsByGroup = new Map();
    const schemas = apiSpec.content.components?.schemas || apiSpec.content.definitions || {};
    
    // Initialize model tracking
    const modelUsage = new Map(); // model -> Set of resource types
    
    Object.entries(apiSpec.content.paths).forEach(([path, methods]) => {
      const resourceType = getResourceType(path);
      if (!groups.has(resourceType)) {
        groups.set(resourceType, []);
        modelsByGroup.set(resourceType, new Set());
      }
      
      // Process each method's schemas
      Object.entries(methods).forEach(([method, details]) => {
        // Track request body schema
        if (details.requestBody?.content?.['application/json']?.schema) {
          const schema = details.requestBody.content['application/json'].schema;
          if (schema.$ref) {
            const modelName = extractRef(schema.$ref);
            modelsByGroup.get(resourceType).add(modelName);
            if (!modelUsage.has(modelName)) modelUsage.set(modelName, new Set());
            modelUsage.get(modelName).add(resourceType);
          }
        }
        
        // Track response schemas
        Object.values(details.responses || {}).forEach(response => {
          if (response.content?.['application/json']?.schema) {
            const schema = response.content['application/json'].schema;
            if (schema.$ref) {
              const modelName = extractRef(schema.$ref);
              modelsByGroup.get(resourceType).add(modelName);
              if (!modelUsage.has(modelName)) modelUsage.set(modelName, new Set());
              modelUsage.get(modelName).add(resourceType);
            }
          }
        });
      });
      
      const endpoint = {
        path,
        id: `${resourceType}-${path}`,
        methods: Object.entries(methods).map(([method, details]) => ({
          method,
          ...details
        }))
      };
      
      groups.get(resourceType).push(endpoint);
    });
    
    // Add referenced models to their groups
    modelUsage.forEach((resourceTypes, modelName) => {
      resourceTypes.forEach(resourceType => {
        if (!modelsByGroup.has(resourceType)) {
          modelsByGroup.set(resourceType, new Set());
        }
        modelsByGroup.get(resourceType).add(modelName);
      });
    });
    
    return { groups, modelsByGroup };
  }, [apiSpec, getResourceType, extractRef]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setMatchingItems(new Set());
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const matches = new Set();

    // Search in endpoints and their methods
    Array.from(groups.entries()).forEach(([resourceType, endpoints]) => {
      endpoints.forEach(endpoint => {
        const pathMatches = endpoint.path.toLowerCase().includes(searchLower);
        if (pathMatches) {
          matches.add(endpoint.id);
          matches.add(resourceType);
        }

        endpoint.methods.forEach(({ method, summary, description }) => {
          if (
            summary?.toLowerCase().includes(searchLower) ||
            description?.toLowerCase().includes(searchLower)
          ) {
            matches.add(`${endpoint.id}-${method}`);
            matches.add(endpoint.id);
            matches.add(resourceType);
          }
        });
      });

      // Search in models associated with this resource type
      const models = modelsByGroup.get(resourceType) || new Set();
      models.forEach(modelName => {
        if (modelName.toLowerCase().includes(searchLower)) {
          matches.add(`model-${modelName}`);
          matches.add(resourceType);
        }
      });
    });

    setMatchingItems(matches);
  }, [searchTerm, groups, modelsByGroup]);

  // Handle search expansion and scrolling
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && matchingItems.size > 0) {
      // First, close all nodes
      setExpandedResources(new Set());
      setExpandedEndpoints(new Set());
      setExpandedModels(new Set());

      // After a brief delay to allow state updates, expand matching nodes
      setTimeout(() => {
        // Expand all resource types that have matches
        const newExpandedResources = new Set();
        const newExpandedEndpoints = new Set();
        const newExpandedModels = new Set();

        Array.from(matchingItems).forEach(id => {
          if (groups.has(id)) {
            // If it's a resource type
            newExpandedResources.add(id);
          } else if (id.startsWith('model-')) {
            // If it's a model
            const modelName = id.replace('model-', '');
            newExpandedModels.add(modelName);
          } else {
            // If it's an endpoint
            const endpointId = id.split('-')[0];
            newExpandedEndpoints.add(endpointId);
          }
        });

        setExpandedResources(newExpandedResources);
        setExpandedEndpoints(newExpandedEndpoints);
        setExpandedModels(newExpandedModels);

        // Scroll to first match after another short delay to allow for expansion
        setTimeout(() => {
          const firstMatch = document.querySelector('[data-highlight="true"]');
          if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }, 50);
    }
  };

  const toggleResource = (resourceType) => {
    setExpandedResources(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(resourceType)) {
        newExpanded.delete(resourceType);
      } else {
        newExpanded.add(resourceType);
      }
      return newExpanded;
    });
  };

  const toggleEndpoint = (endpointId) => {
    setExpandedEndpoints(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(endpointId)) {
        newExpanded.delete(endpointId);
      } else {
        newExpanded.add(endpointId);
      }
      return newExpanded;
    });
  };

  const toggleModel = (modelName) => {
    setExpandedModels(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(modelName)) {
        newExpanded.delete(modelName);
      } else {
        newExpanded.add(modelName);
      }
      return newExpanded;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">API Specification: {apiSpec.name}</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search endpoints and models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="space-y-4">
                {Array.from(groups.entries()).map(([resourceType, endpoints]) => {
                  const models = modelsByGroup.get(resourceType) || new Set();
                  const shouldHighlight = matchingItems.has(resourceType);
                  
                  return (
                    <div key={resourceType} className="border rounded-lg">
                      <button
                        onClick={() => toggleResource(resourceType)}
                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 ${
                          shouldHighlight ? 'bg-yellow-50' : ''
                        }`}
                        data-highlight={shouldHighlight}
                      >
                        <span className="font-medium capitalize">{resourceType}</span>
                        {expandedResources.has(resourceType) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>

                      {expandedResources.has(resourceType) && (
                        <div className="border-t divide-y">
                          {/* Endpoints */}
                          {endpoints.map((endpoint) => (
                            <div key={endpoint.id} className={`${
                              matchingItems.has(endpoint.id) ? 'bg-yellow-50' : ''
                            }`}
                              data-highlight={matchingItems.has(endpoint.id)}
                            >
                              <div className="p-4">
                                <div className="font-mono text-sm">{endpoint.path}</div>
                                <div className="mt-2 space-y-2">
                                  {endpoint.methods.map(({ method, summary }) => (
                                    <div
                                      key={`${endpoint.id}-${method}`}
                                      className={`flex items-center gap-2 ${
                                        matchingItems.has(`${endpoint.id}-${method}`) ? 'bg-yellow-50' : ''
                                      }`}
                                      data-highlight={matchingItems.has(`${endpoint.id}-${method}`)}
                                    >
                                      <span className={`px-2 py-1 text-xs font-medium rounded uppercase
                                        ${method === 'get' ? 'bg-blue-100 text-blue-700' :
                                          method === 'post' ? 'bg-green-100 text-green-700' :
                                          method === 'put' ? 'bg-yellow-100 text-yellow-700' :
                                          method === 'delete' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'}`}
                                      >
                                        {method.toUpperCase()}
                                      </span>
                                      <span className="text-sm text-gray-600">{summary}</span>
                                      <button
                                        onClick={() => handleEndpointSelect(endpoint, method)}
                                        className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                                        title="Test Endpoint"
                                      >
                                        <Play size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Models used by this resource */}
                          {models.size > 0 && (
                            <div className="p-4 bg-gray-50">
                              <h3 className="text-sm font-medium text-gray-500 mb-3">Data Models</h3>
                              <div className="space-y-3">
                                {Array.from(models).map(modelName => {
                                  const schema = apiSpec.content.components?.schemas?.[modelName] ||
                                               apiSpec.content.definitions?.[modelName];
                                  if (!schema) return null;

                                  return (
                                    <div
                                      key={`${resourceType}-${modelName}`}
                                      className={`border rounded bg-white ${
                                        matchingItems.has(`model-${modelName}`) ? 'bg-yellow-50' : ''
                                      }`}
                                      data-highlight={matchingItems.has(`model-${modelName}`)}
                                    >
                                      <button
                                        onClick={() => toggleModel(modelName)}
                                        className="w-full flex items-center justify-between p-3"
                                      >
                                        <span className="font-medium">{modelName}</span>
                                        {expandedModels.has(modelName) ? (
                                          <ChevronDown size={16} />
                                        ) : (
                                          <ChevronRight size={16} />
                                        )}
                                      </button>

                                      {expandedModels.has(modelName) && (
                                        <div className="border-t p-3">
                                          <pre className="text-sm whitespace-pre-wrap">
                                            {JSON.stringify(schema, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Endpoint Drawer */}
      {isTestDrawerOpen && selectedEndpoint && (
        <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl border-l transform transition-transform">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Test Endpoint</h3>
              <button
                onClick={() => setIsTestDrawerOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <div className="space-y-6">
                {/* Endpoint Info */}
                <div>
                  <div className="font-medium mb-2">Endpoint</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded uppercase
                      ${selectedEndpoint?.method === 'get' ? 'bg-blue-100 text-blue-700' :
                        selectedEndpoint?.method === 'post' ? 'bg-green-100 text-green-700' :
                        selectedEndpoint?.method === 'put' ? 'bg-yellow-100 text-yellow-700' :
                        selectedEndpoint?.method === 'delete' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'}`}
                    >
                      {selectedEndpoint?.method.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm">{selectedEndpoint?.path}</span>
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Headers</div>
                    <button
                      onClick={() => {
                        setTestRequest(prev => ({
                          ...prev,
                          headers: getDefaultHeaders()
                        }));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Set Default Headers
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(testRequest.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newHeaders = { ...testRequest.headers };
                            delete newHeaders[key];
                            newHeaders[e.target.value] = value;
                            setTestRequest(prev => ({ ...prev, headers: newHeaders }));
                          }}
                          className="flex-1 px-3 py-1 border rounded text-sm"
                          placeholder="Header name"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setTestRequest(prev => ({
                              ...prev,
                              headers: {
                                ...prev.headers,
                                [key]: e.target.value
                              }
                            }));
                          }}
                          className="flex-1 px-3 py-1 border rounded text-sm"
                          placeholder="Header value"
                        />
                        <button
                          onClick={() => {
                            const newHeaders = { ...testRequest.headers };
                            delete newHeaders[key];
                            setTestRequest(prev => ({ ...prev, headers: newHeaders }));
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHeader.key}
                        onChange={(e) => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                        className="flex-1 px-3 py-1 border rounded text-sm"
                        placeholder="New header name"
                      />
                      <input
                        type="text"
                        value={newHeader.value}
                        onChange={(e) => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                        className="flex-1 px-3 py-1 border rounded text-sm"
                        placeholder="New header value"
                      />
                      <button
                        onClick={addHeader}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        disabled={!newHeader.key || !newHeader.value}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Query Parameters */}
                <div>
                  <div className="font-medium mb-2">Query Parameters</div>
                  <div className="space-y-2">
                    {Object.entries(testRequest.queryParams).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newParams = { ...testRequest.queryParams };
                            delete newParams[key];
                            newParams[e.target.value] = value;
                            setTestRequest(prev => ({ ...prev, queryParams: newParams }));
                          }}
                          className="flex-1 px-3 py-1 border rounded text-sm"
                          placeholder="Parameter name"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setTestRequest(prev => ({
                              ...prev,
                              queryParams: {
                                ...prev.queryParams,
                                [key]: e.target.value
                              }
                            }));
                          }}
                          className="flex-1 px-3 py-1 border rounded text-sm"
                          placeholder="Parameter value"
                        />
                        <button
                          onClick={() => {
                            const newParams = { ...testRequest.queryParams };
                            delete newParams[key];
                            setTestRequest(prev => ({ ...prev, queryParams: newParams }));
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setTestRequest(prev => ({
                          ...prev,
                          queryParams: {
                            ...prev.queryParams,
                            [`param${Object.keys(prev.queryParams).length + 1}`]: ''
                          }
                        }));
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} /> Add Parameter
                    </button>
                  </div>
                </div>

                {/* Request Body */}
                {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint?.method.toUpperCase()) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Request Body</div>
                      <button
                        onClick={() => {
                          const mockBody = generateMockRequestBody(selectedEndpoint);
                          setTestRequest(prev => ({
                            ...prev,
                            body: mockBody
                          }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Generate Mock Request
                      </button>
                    </div>
                    <textarea
                      value={testRequest.body}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full h-48 px-3 py-2 border rounded font-mono text-sm"
                      placeholder="Enter request body (JSON)"
                    />
                  </div>
                )}

                {/* Test Button */}
                <button
                  onClick={handleTestRequest}
                  disabled={testRequest.isLoading}
                  className={`w-full py-2 px-4 rounded font-medium ${
                    testRequest.isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {testRequest.isLoading ? 'Testing...' : 'Test Endpoint'}
                </button>

                {/* Response */}
                {(testRequest.response || testRequest.error) && (
                  <div>
                    <div className="font-medium mb-2">Response</div>
                    <pre className={`p-4 rounded font-mono text-sm overflow-auto max-h-96 ${
                      testRequest.error ? 'bg-red-50 text-red-700' : 'bg-gray-50'
                    }`}>
                      {testRequest.error || formatJson(testRequest.response)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiSpecViewer;
