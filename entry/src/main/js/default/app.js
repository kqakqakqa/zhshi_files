import app from '@system.app';

export default {
    onCreate() {
        console.info(`${app.getInfo().appName} v${app.getInfo().versionName} onCreate`);
    },
    onDestroy() {
        console.info(`${app.getInfo().appName} v${app.getInfo().versionName} onDestroy`);
    }
};