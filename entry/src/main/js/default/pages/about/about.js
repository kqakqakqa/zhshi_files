import router from '@system.router';
import app from '@system.app';

export default {
  data: {
    versionName: app.getInfo().versionName,
  },
  onInit() {},
  onBack(){
    router.replace({uri: "/pages/index/index"});
  }
}
