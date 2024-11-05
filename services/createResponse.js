const createResponse = (success, message, data = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
});

export default createResponse;
