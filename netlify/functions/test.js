// Create a test.js in netlify/functions
exports.handler = async function () {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Function is working" }),
    };
};
