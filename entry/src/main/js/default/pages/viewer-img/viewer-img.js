import file from "@system.file";

import UiSizes from "../../UiSizes.js";
import BundleName from "../../BundleName.js";
import Router from "../../Router.js";

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    bundleName: "",
    paths: [],
    showTitle: true,
    fileName: "",
    imgCopyName: "",
  },
  onInit() {
    UiSizes.init(data => {
      this.uiSizes = data;
      this.uiRefresh = true;
    });
    BundleName.getBundleName(bundleName => {
      this.bundleName = bundleName;
      this.openPath();
    });
  },
  openPath() {
    this.fileName = this.paths[this.paths.length - 1].slice(1);
    const fileExts = this.fileName.split(".");
    const fileExtsLen = fileExts.length;
    const fileExt = fileExtsLen > 1 ? fileExts[fileExtsLen - 1].toLowerCase() : "";
    const fileSubExt = fileExtsLen > 2 ? fileExts[fileExtsLen - 2].toLowerCase() : "";
    const isSubExtImage = (
      fileSubExt === "bmp" ||
      fileSubExt === "jpg" ||
      fileSubExt === "png" ||
      fileSubExt === "bin"
    );

    // image
    this.imgCopyName = Date.now() + "." + (isSubExtImage ? fileSubExt : fileExt);
    const imgDir = "internal://app\\..\\../run/" + this.bundleName + "/assets/js/default/zhshi-file-img";
    file.rmdir({
      uri: imgDir,
      recursive: true,
      complete: () => {
        file.mkdir({
          uri: imgDir,
          complete: () => {
            file.copy({
              srcUri: "internal://app" + this.paths.join(""),
              dstUri: imgDir + "/" + this.imgCopyName,
              complete: () => {
                this.uiRefresh = false;
                setInterval(() => {
                  this.uiRefresh = true;
                }, 100);
              },
            });
          }
        });
      },
    });
  },
  nullFn() { },
  onGoBackClick() {
    this.paths.pop();
    return Router.replace({
      uri: "pages/viewer-dir/viewer-dir",
      params: { paths: this.paths },
    });
  },
  onImgClick() {
    this.showTitle = !this.showTitle;
  },
}