export function createResponse(success, message, data = null) {
  return {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };
}

export function handleResponse(res, statusCode, status, message, data = null) {
  return res.status(statusCode).json(createResponse(status, message, data));
}
