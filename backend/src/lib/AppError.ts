// A known, expected error (bad input, not found, rule broken...).
// The error handler turns it into a clean JSON response with this status code.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'Choose who you are acting as') {
    return new AppError(401, message);
  }

  static forbidden(message = 'Not allowed') {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  static conflict(message = 'Conflict', details?: unknown) {
    return new AppError(409, message, details);
  }

  // The request is well-formed but breaks business rules; details lists every reason.
  static ruleViolation(message: string, details: unknown) {
    return new AppError(422, message, details);
  }
}
