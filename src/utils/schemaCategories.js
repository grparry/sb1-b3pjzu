// Domain-specific categories and their associated keywords
const CATEGORY_PATTERNS = {
  ACCOUNT_FINANCIAL: {
    name: 'Account & Financial',
    patterns: [
      'account', 'bank', 'fund', 'order', 'payment', 'withdraw', 'invest', 
      'portfolio', 'annuity', 'income', 'pay', 'transaction'
    ]
  },
  PROFILE_USER: {
    name: 'Profile & User Management',
    patterns: [
      'profile', 'user', 'login', 'credential', 'enterprise', 'contact',
      'related', 'zendesk'
    ]
  },
  APPOINTMENT: {
    name: 'Appointment & Scheduling',
    patterns: [
      'appointment', 'booking', 'schedule', 'meeting'
    ]
  },
  MEDICAL_HEALTH: {
    name: 'Medical & Health',
    patterns: [
      'medical', 'health', 'diagnosis', 'condition', 'cancer', 'heart',
      'stroke', 'respiratory', 'neurological', 'medication'
    ]
  },
  PLANNING_GOALS: {
    name: 'Planning & Goals',
    patterns: [
      'goal', 'plan', 'lifestyle', 'strategy', 'objective'
    ]
  },
  POLICY_COVERAGE: {
    name: 'Policy & Coverage',
    patterns: [
      'policy', 'coverage', 'product', 'insurance', 'benefit'
    ]
  },
  CONTENT_KNOWLEDGE: {
    name: 'Content & Knowledge Management',
    patterns: [
      'content', 'kc', 'knowledge', 'article', 'post', 'category',
      'tag', 'metadata', 'link'
    ]
  },
  SYSTEM_CONFIG: {
    name: 'System & Configuration',
    patterns: [
      'feature', 'config', 'setting', 'notification', 'system',
      'validation', 'option', 'nudge'
    ]
  },
  ASSET_PORTFOLIO: {
    name: 'Asset & Portfolio Management',
    patterns: [
      'asset', 'portfolio', 'custodian', 'investment'
    ]
  },
  DOCUMENTS_RECORDS: {
    name: 'Documents & Records',
    patterns: [
      'document', 'record', 'attachment', 'comment', 'file',
      'beneficiary', 'employment', 'tracing'
    ]
  }
};

// Common model type suffixes and their meanings
const MODEL_SUFFIXES = {
  'RM': 'Resource Model',
  'VM': 'View Model',
  'DTO': 'Data Transfer Object',
  'Info': 'Information Model',
  'Context': 'Context Model'
};

/**
 * Analyzes a schema's properties to find common patterns
 * @param {Object} schema - The schema definition
 * @returns {Set<string>} Set of identified property-based patterns
 */
function analyzeSchemaProperties(schema) {
  const patterns = new Set();
  
  if (!schema || !schema.properties) return patterns;

  // Look for common property patterns
  const propertyNames = Object.keys(schema.properties);
  
  // Financial patterns
  if (propertyNames.some(prop => /amount|balance|currency|payment/i.test(prop))) {
    patterns.add('account');
    patterns.add('financial');
  }

  // User/Profile patterns
  if (propertyNames.some(prop => /user|email|phone|address/i.test(prop))) {
    patterns.add('profile');
    patterns.add('user');
  }

  // Date/Time patterns
  if (propertyNames.some(prop => /date|time|schedule|appointment/i.test(prop))) {
    patterns.add('appointment');
    patterns.add('schedule');
  }

  // Medical/Health patterns
  if (propertyNames.some(prop => /diagnosis|condition|symptom|treatment/i.test(prop))) {
    patterns.add('medical');
    patterns.add('health');
  }

  return patterns;
}

/**
 * Categorizes a schema based on its name and properties
 * @param {string} schemaName - Name of the schema
 * @param {Object} schema - The schema definition
 * @returns {Object} Category information including main and secondary categories
 */
export function categorizeSchema(schemaName, schema) {
  const scores = new Map();
  const normalizedName = schemaName.toLowerCase();
  
  // Initialize scores for each category
  Object.entries(CATEGORY_PATTERNS).forEach(([category, {patterns}]) => {
    scores.set(category, 0);
    
    // Score based on name patterns
    patterns.forEach(pattern => {
      if (normalizedName.includes(pattern.toLowerCase())) {
        scores.set(category, scores.get(category) + 2); // Name matches are weighted more heavily
      }
    });
  });

  // Add scores based on property analysis
  const propertyPatterns = analyzeSchemaProperties(schema);
  propertyPatterns.forEach(pattern => {
    Object.entries(CATEGORY_PATTERNS).forEach(([category, {patterns}]) => {
      if (patterns.includes(pattern)) {
        scores.set(category, scores.get(category) + 1);
      }
    });
  });

  // Find the highest scoring categories
  let maxScore = 0;
  let mainCategory = null;
  let secondaryCategories = [];

  scores.forEach((score, category) => {
    if (score > maxScore) {
      maxScore = score;
      mainCategory = category;
    } else if (score === maxScore && maxScore > 0) {
      secondaryCategories.push(category);
    }
  });

  // Handle model type suffixes
  const suffix = Object.keys(MODEL_SUFFIXES).find(suffix => 
    schemaName.endsWith(suffix)
  );

  // If no category was found, return uncategorized
  if (!mainCategory || !CATEGORY_PATTERNS[mainCategory]) {
    return {
      mainCategory: 'Uncategorized',
      secondaryCategories: [],
      modelType: suffix ? MODEL_SUFFIXES[suffix] : null,
      confidence: 0
    };
  }

  return {
    mainCategory: CATEGORY_PATTERNS[mainCategory].name,
    secondaryCategories: secondaryCategories
      .map(cat => CATEGORY_PATTERNS[cat]?.name)
      .filter(Boolean), // Filter out any undefined names
    modelType: suffix ? MODEL_SUFFIXES[suffix] : null,
    confidence: maxScore
  };
}

/**
 * Groups schemas into categories
 * @param {Object} schemas - Map of schema names to definitions
 * @returns {Object} Categorized schemas
 */
export function groupSchemasByCategory(schemas) {
  const categorized = new Map();
  const uncategorized = [];

  Object.entries(schemas).forEach(([schemaName, schema]) => {
    const categorization = categorizeSchema(schemaName, schema);
    
    if (categorization.mainCategory === 'Uncategorized' || categorization.confidence === 0) {
      uncategorized.push({
        name: schemaName,  // Make sure to include the schema name
        schema,
        type: categorization.modelType
      });
    } else {
      if (!categorized.has(categorization.mainCategory)) {
        categorized.set(categorization.mainCategory, []);
      }
      categorized.get(categorization.mainCategory).push({
        name: schemaName,  // Make sure to include the schema name
        schema,
        type: categorization.modelType,
        secondaryCategories: categorization.secondaryCategories
      });
    }
  });

  // Sort schemas within each category
  categorized.forEach(schemas => {
    schemas.sort((a, b) => a.name.localeCompare(b.name));
  });
  uncategorized.sort((a, b) => a.name.localeCompare(b.name));

  return { categorized, uncategorized };
}
