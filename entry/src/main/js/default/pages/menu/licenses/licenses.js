import app from "@system.app";

import router from "../../../Router.js";
import UiSizes from "../../../UiSizes.js"

export default {
  data: {
    uiSizes: {},
    versionName: app.getInfo().versionName,
    appName: app.getInfo().appName.split("$string:").join(""),
    licenses: `开放源代码许可：

名称：zhshi_snake
源码：https://github.com/kqakqakqa/zhshi_snake
许可：MIT License

名称：min-gluttonous-snake-js
源码：https://github.com/kqakqakqa/min-gluttonous-snake-js
许可：MIT License`,
  },
  onInit() {
    UiSizes.getUiSizes(uiSizes => {
      this.uiSizes = uiSizes;
    });
  },
  swipeBack(data) {
    if (data.direction === "right") return router.replace({
      uri: "/pages/menu/menu",
    });
  },
}