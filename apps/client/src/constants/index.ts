// API and Network Constants
export const API_TIMEOUTS = {
  DEFAULT: 30000,           // 30 seconds - standard operations
  UPLOAD: 300000,           // 5 minutes - file uploads
  DELETE_BUCKET: 120000,    // 2 minutes - bucket deletion (empties first)
  DELETE_FOLDER: 120000,    // 2 minutes - recursive folder deletion
  RENAME: 60000,            // 1 minute - rename (copy + delete)
  CONNECTION_TEST: 60000,   // 1 minute - connection testing
} as const;

// UI Constants
export const UI_DELAYS = {
  SEARCH_DEBOUNCE: 150,     // Debounce delay for search inputs (ms)
} as const;

// Validation Constants
export const VALIDATION = {
  BUCKET_NAME_MIN: 3,
  BUCKET_NAME_MAX: 63,
  OBJECT_KEY_MAX: 1024,
  FILE_NAME_MAX: 255,
} as const;

// Pagination Constants
export const PAGINATION = {
  OBJECTS_PER_PAGE: 1000,   // S3 list objects limit
  VIRTUAL_SCROLL_THRESHOLD: 100, // Use virtual scroll when items exceed this
  ROW_HEIGHT: 44,           // Height of each row in virtual scroll (px)
  OVERSCAN_COUNT: 5,        // Extra rows to render above/below viewport
  LOAD_MORE_THRESHOLD: 20,  // Start loading more when within this many items of the end
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  THEME: 's3-explorer-theme',
  WELCOME_DISMISSED: 's3-explorer-welcome-dismissed',
  SIDEBAR_COLLAPSED: 's3-explorer-sidebar-collapsed',
} as const;

