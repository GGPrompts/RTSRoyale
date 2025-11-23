// Configuration for Final Showdown timing
// Modify these values for faster testing during development

export const SHOWDOWN_CONFIG = {
  // Production timings (2:30 match)
  PRODUCTION: {
    PHASE_WARNING_TIME: 120,   // 2:00 - Warning phase
    PHASE_COLLAPSE_TIME: 135,  // 2:15 - Collapse phase
    PHASE_SHOWDOWN_TIME: 150,  // 2:30 - Final showdown
    MATCH_END_TIME: 180        // 3:00 - Match ends
  },

  // Fast testing timings (30 second match)
  TESTING: {
    PHASE_WARNING_TIME: 10,    // 0:10 - Warning phase
    PHASE_COLLAPSE_TIME: 15,   // 0:15 - Collapse phase
    PHASE_SHOWDOWN_TIME: 20,   // 0:20 - Final showdown
    MATCH_END_TIME: 30         // 0:30 - Match ends
  }
};

// Set to true for faster testing, false for production
export const USE_TESTING_TIMINGS = false;

// Get current configuration
export function getTimings() {
  return USE_TESTING_TIMINGS ? SHOWDOWN_CONFIG.TESTING : SHOWDOWN_CONFIG.PRODUCTION;
}