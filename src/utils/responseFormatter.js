const formatResponse = (success, status, message, data = null, errors = null) => {
  return { success, status, message, data: data || {}, errors };
};
module.exports = { formatResponse };
