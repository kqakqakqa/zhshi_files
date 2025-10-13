import storage from "@system.storage";
import file from "@system.file";

const marker = Date.now();

export default {
  getBundleName(thenFn) {
    storage.get({
      key: "bundleName",
      default: "",
      success(value) {
        if (value) return thenFn(value);
        storage.set({
          key: "bundleNameMarker",
          value: marker,
          success() {
            file.list({
              uri: "internal://app/..",
              success(listData) {
                const list = listData.fileList;
                let i = 0;
                (function next() {
                  if (i >= list.length) return;
                  const bundleName = list[i++].uri;
                  file.readText({
                    uri: "internal://app/..\\" + bundleName + "/kvstore/bundleNameMarker",
                    success(text) {
                      if (text === marker) {
                        storage.set({ key: "bundleName", value: bundleName });
                        storage.delete({ key: "bundleNameMarker" });
                        thenFn(bundleName);
                      } else next();
                    },
                    fail: next
                  });
                })();
              }
            });
          }
        });
      }
    });
  }
};