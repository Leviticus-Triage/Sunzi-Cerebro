/**
 * Error Handling Middleware
 * Centralized error handling for the Sunzi Cerebro backend
 */

export const errorHandler = (error, req, res, next) => {
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error
  let status = error.status || error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let details = {};

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = { validationErrors: error.details };
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Resource Not Found';
  } else if (error.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service Unavailable - Connection Refused';
    details = { service: error.address || 'unknown' };
  } else if (error.code === 'ETIMEDOUT') {
    status = 504;
    message = 'Gateway Timeout';
  }

  // Development vs Production error details
  const errorResponse = {
    error: {
      status,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(Object.keys(details).length > 0 && { details })
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.requestId) {
    errorResponse.error.requestId = req.requestId;
  }

  res.status(status).json(errorResponse);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Endpoint Not Found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      suggestion: 'Check the API documentation at /api for available endpoints'
    }
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};