console.info("Router.js onImport");

export default {
  /**
   *
   * @param {Object} d
   * @param {string} d.uri
   * @param {Object} [d.params]
   * @param {boolean} [d.direct]
   *
   */
  replace(d) {
    const params = d.params || {};
    const replace = {
      uri: d.uri,
      params: params,
    };
    $app.getImports().router.replace(
      d.direct ?
        replace :
        { uri: "/pages/router/router", params: replace }
    );
  },
}