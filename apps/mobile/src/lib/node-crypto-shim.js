// Metro alias for Node's `crypto` module. Parse's react-native build calls
// `require('crypto').randomUUID`, which Hermes lacks; expo-crypto provides it natively.
const { randomUUID } = require('expo-crypto');

module.exports = { randomUUID };
