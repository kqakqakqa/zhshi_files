import app from "@system.app";

import router from "../../Router.js";
import UiSizes from "../../UiSizes.js"
import HeaderTimeBattery from "../../HeaderTimeBattery.js"

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    timeBatteryStr: "",
  },
  onInit() {
    UiSizes.init(this.updateUiSizes);
    HeaderTimeBattery.subscribe(this.updateTimeBattery);
  },
  updateUiSizes(data) {
    this.uiSizes = data;
    this.uiRefresh = true;
  },
  updateTimeBattery(data) {
    this.timeBatteryStr = data.time + "  " + data.battery;
  },
  clickAbout() {
    router.replace({
      uri: "/pages/menu/about/about",
    });
  },
  clickLicenses() {
    router.replace({
      uri: "/pages/menu/licenses/licenses",
    });
  },
  clickDeviceInfo() {
    router.replace({
      uri: "/pages/menu/deviceInfo/deviceInfo",
    });
  },
  swipeBack(data) {
    if (data.direction === "up") return router.replace({
      uri: "/pages/snake/snake",
    });
  },
  nullFn() { },
  exitApp() {
    app.terminate();
  },
}