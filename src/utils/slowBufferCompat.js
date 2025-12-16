const bufferModule = require("buffer");

// Node.js 25 removed buffer.SlowBuffer. Some dependencies (e.g., jsonwebtoken -> jwa)
// still expect it to exist and access its prototype. Provide a lightweight fallback
// that points to the main Buffer class so those libraries keep working.
if (!bufferModule.SlowBuffer || !bufferModule.SlowBuffer.prototype) {
    bufferModule.SlowBuffer = bufferModule.Buffer;
}

module.exports = bufferModule.SlowBuffer;
