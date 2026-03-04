const asyncHandler = require('../../../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls the wrapped function with req, res, next', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);

    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('catches async errors and passes to next', async () => {
    const error = new Error('Test error');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);

    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next on success', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);

    const next = jest.fn();
    await wrapped({}, {}, next);

    expect(next).not.toHaveBeenCalled();
  });
});
