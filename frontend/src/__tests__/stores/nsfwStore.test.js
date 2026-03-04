import { describe, it, expect, beforeEach } from 'vitest';
import { useNsfwStore } from '@/stores/nsfwStore';

describe('nsfwStore', () => {
  beforeEach(() => {
    // Reset store state
    useNsfwStore.setState({ nsfwEnabled: false });
    localStorage.clear();
  });

  it('has nsfwEnabled false by default', () => {
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });

  it('toggle flips nsfwEnabled', () => {
    useNsfwStore.getState().toggle();
    expect(useNsfwStore.getState().nsfwEnabled).toBe(true);

    useNsfwStore.getState().toggle();
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });

  it('setEnabled sets to specific value', () => {
    useNsfwStore.getState().setEnabled(true);
    expect(useNsfwStore.getState().nsfwEnabled).toBe(true);

    useNsfwStore.getState().setEnabled(false);
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });
});
