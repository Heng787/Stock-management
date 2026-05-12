import process from 'node:process';

const errorHandler = (err, req, res, _next) => {
  console.error(`\x1b[31m[Error]\x1b[0m ${err.stack}`);
  
  if (err.name === 'ValidationError') {
    console.error('[Validation Error Details]:', JSON.stringify(err.errors, null, 2));
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err.errors ? err.errors : undefined,
    code: statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
