exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: "",
        };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            status: "OK",
            timestamp: new Date().toISOString(),
            service: "Discord OAuth2 Callback Handler",
            version: "1.0.0",
        }),
    };
};
