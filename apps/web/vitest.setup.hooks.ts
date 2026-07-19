import { handlers } from 'mocks/handlers';
import { setupServer } from 'msw/node';

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers());
