// helpers/getTictactoeImageSrc.js (o donde prefieras)
import { sourceTictactoeImages } from "./sourceTictactoeImages";

export const getTictactoeImageSrc = (file) => {
  if (!file) return null;
  try {
    const mod = sourceTictactoeImages(`./${file}`);
    return mod?.default ?? mod; // ✅ soporta svg/png/jpg
  } catch (e) {
    return null;
  }
};
