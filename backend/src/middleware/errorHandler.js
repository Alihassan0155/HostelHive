/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // JSON parsing errors (malformed request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body. Please check your request format.';
    console.error('JSON Parse Error:', err.message);
    return res.status(statusCode).json({
      success: false,
      message,
      error: 'Invalid request body format. Ensure your request is valid JSON with Content-Type: application/json header.',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  // Firebase errors
  if (err.code) {
    switch (err.code) {
      case 'auth/argument-error':
      case 'auth/invalid-credential':
        statusCode = 401;
        message = 'Invalid authentication credentials';
        break;
      case 'permission-denied':
        statusCode = 403;
        message = 'Permission denied';
        break;
      case 'not-found':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'already-exists':
        statusCode = 409;
        message = 'Resource already exists';
        break;
      default:
        statusCode = 500;
        message = err.message || 'An error occurred';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

