'use strict';

const crypto = require('crypto');

const b64url = (input) => Buffer.from(typeof input === 'string' ? input : JSON.stringify(input)).toString('base64url');

/** Signs LiveKit access tokens (HS256 JWT) without the server SDK. */
function createLiveKitTokens({ url, apiKey, apiSecret, now = () => Date.now() }) {
  if (!apiKey || !apiSecret) throw new Error('LiveKit API key and secret are required');
  return {
    url,
    mint({ identity, name, room, ttlSeconds = 7200 }) {
      const iat = Math.floor(now() / 1000);
      const header = b64url({ alg: 'HS256', typ: 'JWT' });
      const payload = b64url({
        iss: apiKey,
        sub: identity,
        name,
        nbf: iat,
        exp: iat + ttlSeconds,
        video: { roomJoin: true, room, canPublish: true, canSubscribe: true },
      });
      const signature = crypto.createHmac('sha256', apiSecret).update(`${header}.${payload}`).digest('base64url');
      return `${header}.${payload}.${signature}`;
    },
  };
}

module.exports = { createLiveKitTokens };
