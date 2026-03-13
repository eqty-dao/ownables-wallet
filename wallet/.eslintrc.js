module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    'react-native/no-inline-styles': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {curly: 'off'},
    },
  ],
};
