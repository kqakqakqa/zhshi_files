console.info("pages/viewer-dir/viewer-dir onInit");

export default {
  data: {
    uiSizes: $app.getImports().UiSizes,
    path: "",
    files: [],
    failData: "",
  },
  onInit() {
    this.openPath();
  },
  onDestroy() {
  },
  onGoParentClick() {
    $app.getImports().paths.paths.push("\\..");
    this.openPath();
  },
  onGoBackClick() {
    if ($app.getImports().paths.paths.length > 0) {
      $app.getImports().paths.paths.pop();
      this.openPath();
    }
  },
  onGoClick(uri) {
    $app.getImports().paths.paths.push("/" + uri);
    this.openPath();
  },
  openPath() {
    this.path = $app.getImports().paths.paths.join("");
    $app.getImports().file.get({
      uri: "internal://app" + this.path,
      success: f => {
        // dir
        if (f.type === "dir") {
          $app.getImports().file.list({
            uri: "internal://app" + this.path,
            success: d2 => {
              this.clearData();
              for (let f = 0; f < d2.fileList.length; f++) {
                this.files.push({
                  uri: d2.fileList[f].uri.split("/").slice(-1).join(""),
                  type: d2.fileList[f].type,
                });
              }
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
            return $app.getImports().Router.replace({ uri: "pages/viewer-img/viewer-img" });
          }

          // text
          return $app.getImports().Router.replace({ uri: "pages/viewer-text/viewer-text" });
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