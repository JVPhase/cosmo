module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@cosmo/game-config": "../../packages/game-config/src/index.ts",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
