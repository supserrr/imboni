const fs = require('fs');
const path = require('path');

/**
 * Patches event-target-shim package.json to add missing ./index export
 * This fixes the warning from react-native-webrtc importing event-target-shim/index
 */
const eventTargetShimPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-webrtc',
  'node_modules',
  'event-target-shim',
  'package.json'
);

if (fs.existsSync(eventTargetShimPath)) {
  const packageJson = JSON.parse(fs.readFileSync(eventTargetShimPath, 'utf8'));
  
  // Add ./index export if it doesn't exist
  if (packageJson.exports && !packageJson.exports['./index']) {
    packageJson.exports['./index'] = {
      import: './index.mjs',
      require: './index.js',
    };
    
    fs.writeFileSync(
      eventTargetShimPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf8'
    );
    console.log('✓ Patched event-target-shim package.json');
  }
} else {
  console.warn('⚠ event-target-shim package.json not found, skipping patch');
}

