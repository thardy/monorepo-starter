import { config } from 'dotenv';

/**
 * Anything that needs to be done VERY EARLY before the server starts goes here
 */

// Check if the environment is local or development
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
  config(); // load .env file into environment variables (local only)
}

const initialize = () => {
  // Don't put any code inside initialize here. This is here just to satisfy tree-shaking. Place code above.
  console.log(`Server pre-start initialization complete`); 
};

export const first = {
    initialize
}; 