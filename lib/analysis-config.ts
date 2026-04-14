export const REPORT_SECTION_COUNT = 2

export const REPORT_CORE_SECTIONS = [
  'Overview',
  'Tech Stack',
  'Project Structure',
  'Data Model',
  'Key Flows',
  'Reading Order',
] as const

export const CRITICAL_PATHS = ['package.json', 'README.md', 'readme.md'] as const

export const MAX_FILE_SIZE_BYTES = 120000
export const MAX_FILES_TO_FETCH = 120
export const MAX_PER_TOP_LEVEL_DIR = 18
export const MAX_PER_EXTENSION = 36
export const FETCH_BATCH_SIZE = 12
export const MAX_FETCH_FAILURE_RATIO = 0.4
export const MIN_FETCHED_FILES = 12
export const MIN_USABLE_FILES_FOR_ANALYSIS = 8

export const ORIENTATION_CONFIG_CHAR_BUDGET = 25000
export const DEEP_DIVE_SCHEMA_CHAR_BUDGET = 15000
export const DEEP_DIVE_ROUTE_CHAR_BUDGET = 15000
export const DEEP_DIVE_SOURCE_CHAR_BUDGET = 10000
export const DEEP_DIVE_SOURCE_FILE_LIMIT = 8

export const OPENROUTER_PROMPT_MAX_TOKENS = 1500
