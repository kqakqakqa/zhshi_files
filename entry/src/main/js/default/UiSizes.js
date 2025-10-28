console.info("UiSizes.js onImport");

const _this = {
  init,
  screenWidth: undefined,
  screenHeight: undefined,
  isCircle: undefined,
  uiWidth: undefined,
  uiHeight: undefined,
  topMargin: undefined,
  leftMargin: undefined,
}

let deviceInfo = {};
let uiSize;

function init(onComplete) {
  $app.getImports().device.getInfo({
    success: data => {
      deviceInfo = data;
    },
    complete: () => {
      _this.screenWidth = deviceInfo.windowWidth;
      _this.screenHeight = deviceInfo.windowHeight;
      _this.isCircle = deviceInfo.screenShape === "circle";
      uiSize = getUiSize(_this.screenWidth, _this.screenHeight);
      _this.uiWidth = uiSize[0];
      _this.uiHeight = uiSize[1];
      _this.topMargin = (_this.screenHeight - _this.uiHeight) / 2;
      _this.leftMargin = (_this.screenWidth - _this.uiWidth) / 2;
      onComplete();
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

export default _this;