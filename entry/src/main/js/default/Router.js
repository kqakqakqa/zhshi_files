import router from "@system.router";

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
    const replace = {
      uri: d.uri,
      params: d.params,
    };
    router.replace(
      d.direct ?
        replace :
        { uri: "/pages/index/index", params: replace }
    );
  },
}