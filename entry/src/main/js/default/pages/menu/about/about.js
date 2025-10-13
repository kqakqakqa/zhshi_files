import app from "@system.app";

import router from "../../../Router.js";
import appName from "../../../AppName.js";
import UiSizes from "../../../UiSizes.js"

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    appName: appName.appName,
    versionName: app.getInfo().versionName,
  },
  onInit() {
    UiSizes.init(this.updateUiSizes);
  },
  updateUiSizes(data) {
    this.uiSizes = data;
    this.uiRefresh = true;
  },
  swipeBack(data) {
    if (data.direction === "right") return router.replace({
      uri: "/pages/menu/menu",
    });
  },
}