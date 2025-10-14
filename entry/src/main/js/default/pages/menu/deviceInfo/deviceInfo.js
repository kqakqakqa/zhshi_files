import device from "@system.device";

import router from "../../../Router.js";
import UiSizes from "../../../UiSizes.js"

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    deviceInfo: "",
  },
  onInit() {
    UiSizes.init(this.updateUiSizes);
    device.getInfo({
      success: data => this.deviceInfo = `设备信息：

品牌：${data.brand ?? "未知"}
生产商: ${data.manufacturer ?? "未知"}
型号: ${data.model ?? "未知"}
代号: ${data.product ?? "未知"}
系统语言: ${data.language ?? "未知"}
系统地区: ${data.region ?? "未知"}
可用窗口宽度: ${data.windowWidth ?? "未知"}
可用窗口高度: ${data.windowHeight ?? "未知"}
屏幕密度: ${data.screenDensity ?? "未知"}
屏幕形状: ${{ "rect": "方形屏", "circle": "圆形屏" }[data.screenShape] ?? data.screenShape ?? "未知"}
系统API版本: ${data.apiVersion ?? "未知"}
版本发布类型: ${data.releaseType ?? "未知"}
设备类型: ${data.deviceType ?? "未知"}`,
    });
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