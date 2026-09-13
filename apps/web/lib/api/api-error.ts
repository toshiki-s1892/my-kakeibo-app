export type ErrorBody = {
  message: string;
  details?: { field: string; message: string }[];
};

export class ApiError extends Error {
  status: number;
  body?: ErrorBody;

  constructor(status: number, body?: ErrorBody) {
    super(body?.message ?? 'APIリクエストが失敗しました');
    this.status = status;
    this.body = body;
  }
}
