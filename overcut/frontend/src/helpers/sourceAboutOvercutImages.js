// frontend/src/helpers/sourceAboutOvercutImages.js

export const sourceAboutOvercutImages = require.context(
  '../assets/images/aboutOvercut',
  true
);

export const getAboutOvercutImage = (name) =>
  sourceAboutOvercutImages(`./${name}`);
