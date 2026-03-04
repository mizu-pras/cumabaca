import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the 401 interceptor behavior
// Mock axios before importing
vi.mock('axios', () => {
  const interceptors = {
    response: { use: vi.fn(), eject: vi.fn() },
    request: { use: vi.fn(), eject: vi.fn() },
  };
  const instance = {
    interceptors,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

import axios from 'axios';

describe('admin api', () => {
  it('creates axios instance with correct config', async () => {
    // Re-import to trigger module initialization
    await import('../../lib/api');

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('registers response interceptor', async () => {
    await import('../../lib/api');

    const instance = axios.create.mock.results[0]?.value;
    expect(instance.interceptors.response.use).toHaveBeenCalled();
  });
});
