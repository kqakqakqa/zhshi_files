import router from "@system.router";

export default {
  data: {
    uri: "pages/viewer-dir/viewer-dir",
    params: undefined,
  },
  onInit() {
    router.replace({
      uri: this.uri,
      params: this.params,
    });
  },
}