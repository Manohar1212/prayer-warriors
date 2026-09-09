const crypto = require('crypto');
const { createLiveKitTokens } = require('./livekit');

const NOW = 1_800_000_000_000;
const b64 = (s) => Buffer.from(s, 'base64url').toString('utf8');

describe('createLiveKitTokens', () => {
  it('mints an HS256 JWT with LiveKit video grants', () => {
    const tokens = createLiveKitTokens({ apiKey: 'APIkey', apiSecret: 'secret', now: () => NOW });
    const token = tokens.mint({ identity: 'u1', name: 'Shiny', room: 'pw-g1-c1', ttlSeconds: 7200 });
    const [h, p, s] = token.split('.');
    expect(JSON.parse(b64(h))).toEqual({ alg: 'HS256', typ: 'JWT' });
    const payload = JSON.parse(b64(p));
    expect(payload).toMatchObject({
      iss: 'APIkey', sub: 'u1', name: 'Shiny', nbf: 1_800_000_000, exp: 1_800_007_200,
      video: { roomJoin: true, room: 'pw-g1-c1', canPublish: true, canSubscribe: true },
    });
    const expected = crypto.createHmac('sha256', 'secret').update(`${h}.${p}`).digest('base64url');
    expect(s).toBe(expected);
  });
});
