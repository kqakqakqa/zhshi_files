console.info("BundleName.js onImport");

const _this = {
  init,
  bundleName: undefined,
};

const marker = "" + Date.now();

function init() {
  $app.getImports().storage.get({
    key: "bundleName",
    default: "",
    success(value) {
      console.log("get bundleName from storage: " + value);
      if (value) return _this.bundleName = value;
      console.log("set bundleNameMarker: " + marker);
      $app.getImports().storage.set({
        key: "bundleNameMarker",
        value: marker,
        success() {
          $app.getImports().file.list({
            uri: "internal://app\\..",
            success(listData) {
              console.log("listData len: " + listData.fileList.length);
              const list = listData.fileList;
              let i = 0;
              function checkBundleName() {
                console.log("checkBundleName");
                if (i >= list.length) return;
                const bundleName = list[i++].uri.split("/").slice(-1)[0];
                console.log("bundleName " + i + ": " + bundleName);
                $app.getImports().file.readText({
                  uri: "internal://app\\../" + bundleName + "/kvstore/bundleNameMarker",
                  success(data) {
                    console.log("read bundleNameMarker: " + data.text);
                    if (data.text === marker) {
                      console.log("match, bundleName: " + bundleName);
                      $app.getImports().storage.set({ key: "bundleName", value: bundleName });
                      $app.getImports().storage.delete({ key: "bundleNameMarker" });
                      return _this.bundleName = bundleName;
                    } else setTimeout(checkBundleName, 0);
                  },
                  fail: str => {
                    console.log("text fail: " + str);
                    setTimeout(checkBundleName, 0);
                  }
                });
              }
              checkBundleName();
            }
          });
        }
      });
    }
  });
}

export default _this;