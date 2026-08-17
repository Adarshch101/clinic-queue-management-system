export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors: unknown[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
