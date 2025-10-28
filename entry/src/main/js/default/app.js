import app from '@system.app';
import storage from "@system.storage";
import file from "@system.file";
import device from "@system.device";
import brightness from "@system.brightness";
import router from "@system.router";
import battery from "@system.battery";

import UiSizes from "./UiSizes.js";
import Router from "./Router.js";
import paths from "./paths.js";
import HeaderTimeBattery from "./HeaderTimeBattery.js";
import BundleName from "./BundleName.js";

const imports = { app, storage, file, device, brightness, router, battery, UiSizes, Router, paths, HeaderTimeBattery, BundleName };

const _this = {
  onCreate() {
    console.info(app.getInfo().appName + " v" + app.getInfo().versionName + " onCreate");
  },
  onDestroy() {
    console.info(app.getInfo().appName + " v" + app.getInfo().versionName + " onDestroy");
  },
  getImports() { return imports },
};

export default _this;