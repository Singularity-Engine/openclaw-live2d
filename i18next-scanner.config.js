// i18next-scanner configuration
module.exports = {
  input: [
    'src/renderer/src/**/*.{js,jsx,ts,tsx}',
    // Use ! to filter out files or directories
    '!src/renderer/src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/renderer/src/i18n/**',
    '!**/node_modules/**',
  ],
  output: './src/renderer/src',
  options: {
    debug: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallbackKey(ns, value) {
        return value;
      },
    },
    lngs: ['en', 'zh'],
    ns: ['translation'],
    defaultLng: 'en',
    defaultNs: 'translation',
    defaultValue(lng, ns, key) {
      if (lng === 'en') {
        // Return key as the default value for English
        return key;
      }
      // Return empty string for other languages
      return '';
    },
    resource: {
      loadPath: 'src/renderer/src/locales/{{lng}}/{{ns}}.json',
      savePath: 'locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    sort: true,
    removeUnusedKeys: true,
    nsSeparator: ':',
    keySeparator: '.',
    pluralSeparator: '_',
    contextSeparator: '_',
    contextDefaultValues: [],
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
  },
};
