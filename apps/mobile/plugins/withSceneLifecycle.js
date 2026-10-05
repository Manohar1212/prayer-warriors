// iOS 27 stops any app at launch that hasn't adopted the UIScene life cycle
// (_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption). Expo ships
// ExpoAppSceneDelegate for this, but the SDK 57 template doesn't wire it up yet,
// so this plugin does: the scene manifest in Info.plist, and an AppDelegate that
// hands its React Native factory to the scene delegate instead of making its own window.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const SCENE_DELEGATE = 'EXExpoAppSceneDelegate';

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: SCENE_DELEGATE,
          },
        ],
      },
    };
    return config;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle expects a Swift AppDelegate');
    }
    let src = config.modResults.contents;
    if (src.includes('ExpoReactNativeFactoryProvider')) return config;

    src = src.replace(
      'class AppDelegate: ExpoAppDelegate {',
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
    );

    // The scene delegate creates the window and starts React Native into it.
    const startBlock =
      /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;
    if (!startBlock.test(src)) {
      throw new Error('withSceneLifecycle could not find the startReactNative block in AppDelegate.swift');
    }
    src = src.replace(startBlock, '');

    config.modResults.contents = src;
    return config;
  });
}

module.exports = function withSceneLifecycle(config) {
  return withSceneAppDelegate(withSceneManifest(config));
};
