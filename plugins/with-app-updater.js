const { withAndroidManifest, withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');
const paths = '<paths xmlns:android="http://schemas.android.com/apk/res/android">\n  <external-files-path name="update_apk" path="Download/updates/"/>\n</paths>\n';
function register(source) {
  if (source.includes('add(AppUpdaterPackage())')) return source;
  const anchor = 'PackageList(this).packages.apply {';
  if (!source.includes(anchor)) throw new Error('Cannot register the app updater in MainApplication');
  return source.replace(anchor, anchor + '\n          add(AppUpdaterPackage())');
}
function configure(manifest) {
  const permissions = manifest['uses-permission'] ||= [];
  if (!permissions.some(p => p.$['android:name'] === 'android.permission.REQUEST_INSTALL_PACKAGES')) {
    permissions.push({ $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' } });
  }
  const app = manifest.application[0];
  const providers = app.provider ||= [];
  if (!providers.some(p => p.$['android:authorities'] === '${applicationId}.updates')) providers.push({
    $: { 'android:name':'androidx.core.content.FileProvider', 'android:authorities':'${applicationId}.updates',
      'android:exported':'false', 'android:grantUriPermissions':'true' },
    'meta-data': [{ $: { 'android:name':'android.support.FILE_PROVIDER_PATHS', 'android:resource':'@xml/update_paths' } }],
  });
  return manifest;
}
module.exports = config => {
  config = withAndroidManifest(config, mod => { configure(mod.modResults.manifest); return mod; });
  config = withMainApplication(config, mod => { mod.modResults.contents = register(mod.modResults.contents); return mod; });
  return withDangerousMod(config, ['android', async mod => {
    const root = mod.modRequest.projectRoot;
    const namespace = mod.android.package;
    const java = path.join(root, 'android/app/src/main/java', ...namespace.split('.'));
    const xml = path.join(root, 'android/app/src/main/res/xml');
    fs.mkdirSync(java, { recursive:true }); fs.mkdirSync(xml, { recursive:true });
    const source = fs.readFileSync(path.join(root, 'native/AppUpdaterModule.kt'), 'utf8')
      .replace('package com.njsoftwares.pokecodefinder', 'package ' + namespace);
    fs.writeFileSync(path.join(java, 'AppUpdaterModule.kt'), source);
    fs.writeFileSync(path.join(xml, 'update_paths.xml'), paths);
    return mod;
  }]);
};
module.exports.register = register;
module.exports.configure = configure;
