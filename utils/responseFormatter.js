

/**
 * Formats the API response.
 * @param {boolean} success - Indicates if the request was successful.
 * @param {number} status - The HTTP status code.
 * @param {string} message - A descriptive message.
 * @param {object|null} data - The payload/data to be returned.
 * @param {object|null} errors - Any errors that occurred.
 * @returns {object} The formatted response object.
 */
const formatResponse = (success, status, message, data = null, errors = null) => {
    return {
        success,
        status,
        message,
        data: data || {},
        errors,
    };
};

module.exports = {
    formatResponse,
};