const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The bundled Bible database is shipped as an asset.
config.resolver.assetExts = [...config.resolver.assetExts, 'db'];

// Parse's react-native build requires Node's `crypto` for randomUUID; alias it to expo-crypto.
const nodeCryptoShim = path.resolve(__dirname, 'src/lib/node-crypto-shim.js');
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    return { type: 'sourceFile', filePath: nodeCryptoShim };
  }
  return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
