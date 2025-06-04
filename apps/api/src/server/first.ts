import { config } from 'dotenv';
import { initializeTypeBox } from '@loomcore/common/validation';

/**
 * Anything that needs to be done VERY EARLY before the server starts goes here
 * ************************* START ********************************************
 */
// Check if the environment is local or development
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
  config(); // load .env file into environment variables (local only)
  // in dev and above environments, the environment variables are set by the k8s deployment
}

// Initialize TypeBox custom validations
initializeTypeBox();

/**
 * ************************* END **********************************************
 */

const initialize = () => {
  // Don't put any code inside initialize here. This is here just to satisfy tree-shaking - without calling a method
  //  from this file, the code will be removed from the bundle when imported. When you import, call initialize().
  //  **** Place code that needs to be executed before the server starts above ****.
  console.log(`Server pre-start initialization complete`); 
};

export const first = {
    initialize
}; 