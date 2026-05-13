export const AD_VIGNETTES_ENABLED = true;

const createSlot = (id, overrides = {}) => ({
  id,
  provider: "google-ads-ready",
  adUnitId: "",
  targetUrl: "",
  ...overrides,
});

export const DESKTOP_AD_VIGNETTE_SLOTS = [
  createSlot("desktop-left-top", {
    side: "left",
    sizeLabel: "Desktop rail",
    fallbackSize: "160 x 280",
  }),
  createSlot("desktop-left-bottom", {
    side: "left",
    sizeLabel: "Desktop rail",
    fallbackSize: "160 x 280",
  }),
  createSlot("desktop-right-top", {
    side: "right",
    sizeLabel: "Desktop rail",
    fallbackSize: "160 x 280",
  }),
  createSlot("desktop-right-bottom", {
    side: "right",
    sizeLabel: "Desktop rail",
    fallbackSize: "160 x 280",
  }),
];

export const TABLET_AD_VIGNETTE_SLOTS = [
  createSlot("tablet-left-top", {
    side: "left",
    sizeLabel: "Tablet side",
    fallbackSize: "Adaptive",
  }),
  createSlot("tablet-left-bottom", {
    side: "left",
    sizeLabel: "Tablet side",
    fallbackSize: "Adaptive",
  }),
  createSlot("tablet-right-top", {
    side: "right",
    sizeLabel: "Tablet side",
    fallbackSize: "Adaptive",
  }),
  createSlot("tablet-right-bottom", {
    side: "right",
    sizeLabel: "Tablet side",
    fallbackSize: "Adaptive",
  }),
];

export const MOBILE_BOTTOM_AD_VIGNETTE_SLOT = createSlot("mobile-bottom", {
  sizeLabel: "Mobile bottom",
  fallbackSize: "Adaptive",
});
