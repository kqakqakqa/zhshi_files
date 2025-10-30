console.info("pages/viewer-dir/viewer-dir onInit");

const maxFiles = 7;
let position = 0;
let fileCount = 0;

export default {
  data: {
    uiSizes: $app.getImports().UiSizes,
    paths: $app.getImports().paths.paths,
    path: "",
    files: [],
    failData: "",
    hasPrev: false,
    hasNext: false,
  },
  onInit() {

  },
  onReady() {
    this.openPath();
  },
  onDestroy() {
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
  onGoClick(uri) {
    this.paths.push("/" + uri.split("/").slice(-1).join(""));
    this.openPath();
  },
  openPath() {
    this.clearPageData();
    this.path = this.paths.join("");
    console.log("open path " + this.path);
    $app.getImports().file.get({
      uri: "internal://app" + this.path,
      success: f => {
        console.log("path info: " + JSON.stringify(f))
        // dir
        if (f.type == "dir") {
          return this.openDir();
        }

        // file
        if (f.type == "file") {
          const fileExts = f.uri.split(".");
          const fileExtsLen = fileExts.length;
          const fileExt = fileExtsLen > 1 ? fileExts[fileExtsLen - 1].toLowerCase() : "";
          const fileSubExt = fileExtsLen > 2 ? fileExts[fileExtsLen - 2].toLowerCase() : "";

          // image
          const isImage = (
            fileExt == "bmp" ||
            fileExt == "jpg" ||
            fileExt == "png" ||
            fileExt == "bin" ||
            fileSubExt == "bmp" ||
            fileSubExt == "jpg" ||
            fileSubExt == "png" ||
            fileSubExt == "bin" ||
            f.length > 102400
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
  openDir() {
    this.clearPathData();
    this.failData = "loading";
    $app.getImports().file.list({
      uri: "internal://app" + this.path,
      success: d2 => {
        fileCount = d2.fileList.length;
        for (let f = position; f < Math.min(position + maxFiles, fileCount); f++) {
          this.files.push({
            uri: d2.fileList[f].uri.split("/").slice(-1).join(""),
            color: d2.fileList[f].type == 'dir' ? '#ffa' : '#aaf',
          });
        }
        this.hasNext = position + maxFiles < fileCount;
        this.hasPrev = position > 0;
        this.failData = "";
      },
      fail: this.showFailData
    });
  },
  clearPathData() {
    this.$refs.fileList.scrollTo({ index: 0 });
    this.files = [];
    this.failData = "";
  },
  clearPageData() {
    position = 0;
    fileCount = 0;
    this.hasPrev = false;
    this.hasNext = false;
  },
  showFailData(data, code = undefined) {
    this.clearPathData();
    this.clearPageData();
    this.failData = code + " " + data + (code == 300 ? "\n(可能是空文件夹)" : "");
  },
  onPrevPageClick() {
    position = Math.max(position - maxFiles, 0);
    this.openDir();
  },
  onNextPageClick() {
    position = Math.min(position + maxFiles, fileCount);
    this.openDir();
  },
}