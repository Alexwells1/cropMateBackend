import { sendSuccess, sendError, sendCreated } from '../../src/utils/response';

function mockRes() {
  const res: { statusCode: number; body: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe('Response Utilities', () => {
  it('sendSuccess sets 200 with correct shape', () => {
    const res = mockRes();
    sendSuccess(res as never, 'OK', { id: 1 });
    expect(res.statusCode).toBe(200);
    expect((res.body as { success: boolean }).success).toBe(true);
    expect((res.body as { message: string }).message).toBe('OK');
  });

  it('sendCreated sets 201', () => {
    const res = mockRes();
    sendCreated(res as never, 'Created');
    expect(res.statusCode).toBe(201);
  });

  it('sendError sets correct status and success=false', () => {
    const res = mockRes();
    sendError(res as never, 'Not found', 404);
    expect(res.statusCode).toBe(404);
    expect((res.body as { success: boolean }).success).toBe(false);
  });
});
