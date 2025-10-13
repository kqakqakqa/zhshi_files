import device from "@system.device";

export default {
  init,
}

let deviceInfo = {};

function init(onComplete) {
  device.getInfo({
    success: data => {
      deviceInfo = data;
    },
    complete: () => {
      const screenWidth = deviceInfo.windowWidth;
      const screenHeight = deviceInfo.windowHeight;
      const isCircle = deviceInfo.screenShape === "circle";
      const uiSize = getUiSize(screenWidth, screenHeight);
      const uiWidth = uiSize[0];
      const uiHeight = uiSize[1];
      const topMargin = (screenHeight - uiHeight) / 2;
      const leftMargin = (screenWidth - uiWidth) / 2;
      onComplete({ screenWidth, screenHeight, isCircle, uiWidth, uiHeight, topMargin, leftMargin });
    },
  });
}

function getUiSize(w, h) {
  if (w === 280 && h === 456) return [276, 360]; // D
  if (w === 336 && h === 480) return [336, 396]; // FIT2
  if (w === 408 && h === 480) return [336, 396]; // FIT3
  if (w === 390 && h === 390) return [276, 276]; // GT2-42mm
  if (w === 454 && h === 454) return [336, 306]; // GT2-46mm
  if (w === 466 && h === 466) return [336, 306]; // GT3
  return [276, 276];
}