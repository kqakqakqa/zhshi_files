import storage from "@system.storage";
import file from "@system.file";

const marker = "" + Date.now();

export default {
  getBundleName(thenFn) {
    storage.get({
      key: "bundleName",
      default: "",
      success(value) {
        // console.log("value: " + value);
        if ("" + value) return thenFn(value);
        // console.log("marker: " + marker);
        storage.set({
          key: "bundleNameMarker",
          value: marker,
          success() {
            file.list({
              uri: "internal://app\\..",
              success(listData) {
                // console.log("listData len: " + listData.fileList.length);
                const list = listData.fileList;
                let i = 0;
                function checkBundleName() {
                  // console.log("checkBundleName");
                  if (i >= list.length) return;
                  const bundleName = list[i++].uri;
                  // console.log("bundleName-" + i + ": " + bundleName);
                  file.readText({
                    uri: "internal://app\\../" + bundleName + "/kvstore/bundleNameMarker",
                    success(data) {
                      // console.log("text: " + data.text);
                      if (data.text === marker) {
                        storage.set({ key: "bundleName", value: bundleName });
                        storage.delete({ key: "bundleNameMarker" });
                        thenFn(bundleName);
                      } else setTimeout(checkBundleName, 0);
                    },
                    fail: str => {
                      // console.log("text fail: " + str);
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
};