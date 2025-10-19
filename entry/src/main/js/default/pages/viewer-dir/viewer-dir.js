import file from "@system.file";

import UiSizes from "../../UiSizes.js";
import Router from "../../Router.js";

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    timeBatteryStr: "",
    paths: [],
    files: [],
    failData: "",
  },
  onInit() {
    UiSizes.init(data => {
      this.uiSizes = data;
      this.uiRefresh = true;
    });
    this.openPath();
  },
  onGoParentClick() {
    this.paths.push("\\..");
    this.openPath();
  },
  onGoBackClick() {
    if (this.paths.length > 0) {
      this.paths.pop();
      this.openPath();
    }
  },
  onGoClick(item) {
    this.paths.push("/" + item.uri.split("/").slice(-1));
    this.openPath();
  },
  openPath() {
    const currentPath = "internal://app" + this.paths.join("");
    file.get({
      uri: currentPath,
      success: f => {
        // dir
        if (f.type === "dir") {
          file.list({
            uri: currentPath,
            success: d2 => {
              this.clearData();
              this.files = d2.fileList;
            },
            fail: this.showFailData
          });
          return;
        }

        // file
        if (f.type === "file") {
          const fileExts = f.uri.split(".");
          const fileExtsLen = fileExts.length;
          const fileExt = fileExtsLen > 1 ? fileExts[fileExtsLen - 1].toLowerCase() : "";
          const fileSubExt = fileExtsLen > 2 ? fileExts[fileExtsLen - 2].toLowerCase() : "";

          // image
          const isImage = (
            fileExt === "bmp" ||
            fileExt === "jpg" ||
            fileExt === "png" ||
            fileExt === "bin" ||
            fileSubExt === "bmp" ||
            fileSubExt === "jpg" ||
            fileSubExt === "png" ||
            fileSubExt === "bin"
          );
          if (isImage) {
            return Router.replace({
              uri: "pages/viewer-img/viewer-img",
              params: { paths: this.paths },
            });
          }

          // text
          return Router.replace({
            uri: "pages/viewer-text/viewer-text",
            params: { paths: this.paths },
          });
        }

        return this.showFailData("未知文件类型 " + f.type);
      },
      fail: this.showFailData,
    });
  },
  clearData() {
    this.files = [];
    this.failData = "";
  },
  showFailData(data, code = undefined) {
    this.clearData();
    this.failData = code + " " + data + (code === 300 ? "\n(可能是空文件夹)" : "");
  },
}