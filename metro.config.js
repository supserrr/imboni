const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports strict checking to allow the fallback resolution
// This prevents the warning for event-target-shim/index import
// The package.json is patched by postinstall script, but Metro may cache the old version
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

