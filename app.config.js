const production = process.env.POKEFINDER_PRODUCTION === '1';
module.exports = {
  name: production ? 'PokeFinder' : 'PokeFinder Teste',
  slug: 'pokefinder',
  plugins: ['expo-image', 'expo-font', 'expo-sharing', ['expo-splash-screen', {
    backgroundColor: '#FFF9EE',
    image: './assets/splash-placeholder.png',
    imageWidth: 12,
    resizeMode: 'contain',
  }]],
  version: require('./package.json').version,
  orientation: 'default',
  icon: './assets/app-icon.png',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.njsoftwares.pokecodefinder', supportsTablet: true },
  android: {
    package: production ? 'com.njsoftwares.pokecodefinder' : 'com.njsoftwares.pokecodefinder.rnpreview',
    versionCode: 45000,
    adaptiveIcon: { foregroundImage: './assets/app-icon.png', backgroundColor: '#244B91' },
    blockedPermissions: [
      'android.permission.RECORD_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
    ],
  },
};

