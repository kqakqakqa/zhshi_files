console.info("pages/index/index onInit");

export default {
  data: {
    uri: "pages/viewer-dir/viewer-dir",
    params: {},
  },
  onInit() {
    $app.getImports().BundleName.init();
    $app.getImports().UiSizes.init(() => {
      $app.getImports().Router.replace({
        uri: this.uri,
        direct: true,
      });
    });
  },
}