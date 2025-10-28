console.info("pages/viewer-img/viewer-img onInit");

export default {
  data: {
    uiSizes: $app.getImports().UiSizes,
    uiRefresh: true,
    showTitle: true,
    fileName: "",
    imgCopyName: "",
  },
  onInit() {
    this.openPath();
  },
  openPath() {
    this.fileName = $app.getImports().paths.paths[$app.getImports().paths.paths.length - 1].split("/")[1];
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
    const imgDir = "internal://app\\..\\../run/" + $app.getImports().BundleName.bundleName + "/assets/js/default/zhshi-file-img";
    $app.getImports().file.rmdir({
      uri: imgDir,
      recursive: true,
      complete: () => {
        $app.getImports().file.mkdir({
          uri: imgDir,
          complete: () => {
            $app.getImports().file.copy({
              srcUri: "internal://app" + $app.getImports().paths.paths.join(""),
              dstUri: imgDir + "/" + this.imgCopyName,
              complete: () => {
                this.uiRefresh = false;
                setInterval(() => {
                  this.uiRefresh = true;
                }, 50);
              },
            });
          }
        });
      },
    });
  },
  nullFn() { },
  onGoBackClick() {
    $app.getImports().paths.paths.pop();
    return $app.getImports().Router.replace({ uri: "pages/viewer-dir/viewer-dir" });
  },
  onImgClick() {
    this.showTitle = !this.showTitle;
  },
}