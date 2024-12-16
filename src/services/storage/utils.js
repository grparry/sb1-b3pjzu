/**
 * Helper function to generate a stable key for records
 * @param {string} storeName 
 * @param {Object} record 
 * @returns {string}
 */
export function generateStableKey(storeName, record) {
    if (!record) return null;

    switch (storeName) {
        case 'mockResponses':
            return generateMockKey(record.method, record.pathname);
        case 'network':
            return `${record.type}-${record.operation?.type}-${Date.now()}`;
        case 'errors':
            return `${record.type}-${Date.now()}`;
        default:
            return record.id || `${storeName}-${Date.now()}`;
    }
}

/**
 * Helper function to safely convert headers to object
 * @param {Headers} headers 
 * @returns {Object}
 */
export function headersToObject(headers) {
    if (!headers) return {};
    if (headers instanceof Headers) {
        return Object.fromEntries(headers.entries());
    }
    if (typeof headers === 'object') {
        return headers;
    }
    return {};
}

/**
 * Update a value in an object by path
 * @param {Object} obj 
 * @param {string|Array} path 
 * @param {any} value 
 * @returns {Object}
 */
export function updateByPath(obj, path, value) {
    if (!obj || !path) return obj;

    const pathArray = Array.isArray(path) ? path : path.split('.');
    const pathLength = pathArray.length;

    return pathArray.reduce((acc, key, index) => {
        if (index === pathLength - 1) {
            // Last element in path, set the value
            acc[key] = value;
        } else {
            // Create nested object if it doesn't exist
            acc[key] = acc[key] || {};
        }
        return acc[key];
    }, obj);
}
