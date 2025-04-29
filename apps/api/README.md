# API Service

This is the backend API service for the monorepo-starter project. The API is built with Express and MongoDB.

## Setup

### Prerequisites

- Node.js (version 16 or higher)
- MongoDB (local instance or connection string)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd monorepo-starter
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Environment Configuration:
   - Copy the `.env.example` file to `.env`
   - Update the environment variables with your MongoDB connection details and other configuration

4. Add an entry to your hosts file for your hostname.local (hostname defaults to "monorepo-starter"). Map this hostname to 127.0.0.1 in your hosts file (e.g. "127.0.0.1	monorepo-starter.local")

## Running the API

### Development Mode

To run the API locally, run the following from the root of the monorepo:

```bash
skaffold dev --no-prune=false --cache-artifacts=false
```

The API will be available at `http://monorepo-starter.local` by default (check your .env file for the hostname).

## Testing

The API uses Vitest for unit and integration testing with an in-memory MongoDB instance for database tests.

### Running Tests

To run all Api tests, from the root of the monorepo, run:

```bash
nx test:all @monorepo-starter/api
```

### Error Display in Tests

By default, most errors in tests are suppressed for cleaner test output. This is controlled by the `debug.showErrors` setting in the `setup.ts` file.

If you need to see detailed error messages for debugging purposes, you can modify the `setup.ts` file:

1. Open `apps/api/src/test/setup.ts`
2. Find the `setApiCommonConfig` function call
3. Change `debug.showErrors` from `false` to `true`:

```typescript
setApiCommonConfig({
  // other config
  debug: {
    showErrors: true  // Change this from false to true
  },
  // other config
});
```

This will enable detailed error reporting during test runs, which can be helpful for debugging failed tests.

### API Test Utilities

The API testing framework includes utility functions in `test-api.utils.ts` and `test.utils.ts` that provide helper methods for common testing tasks such as:

- Setting up test data
- Creating authenticated test requests
- Managing test user sessions

Refer to these utility files for more detailed information on available testing helpers. 