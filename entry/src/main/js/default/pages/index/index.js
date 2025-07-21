import file from '@system.file';
import app from '@system.app';
import router from '@system.router';
import battery from '@system.battery';
import brightness from '@system.brightness';

export default {
  data: {
    paths: ["/app/user"],
    files: [],
    fileType: "",
    fileContent: "",
    showLeftSideSwipe: false,
    showBottomSideSwipe:false,
    leftSideSwipeTimeout:null,
    bottomSideSwipeTimeout: null,
    deviceStatus: "",
    openPosition: 0,
    pageSize: 210,
    showTitle: true,
  },
  onInit() {
    this.openPath();
    brightness.setKeepScreenOn({
      keepScreenOn: true
    });
    setInterval(()=>{
      battery.getStatus({
        success: data=>{
          const batteryStatus = `${data.charging ? "充电中" : `电量${data.level*100}%`}`;
          var date = new Date();
          var hour = date.getHours();
          var minute = date.getMinutes();
          var time = `${hour < 10 ? "0" : ""}${hour}:${minute < 10 ? "0" : ""}${minute}`;
          this.deviceStatus = `${batteryStatus}  ${time}`;
        }
      })
    },1000);
  },
  onGoParentClick(){
    const currentPath = this.paths[this.paths.length - 1];

    let len = currentPath.length;
    while (len > 1 && currentPath.charAt(len - 1) === '/') {
      len--;
    }
    let lastSlash = -1;
    for (let i = len - 1; i >= 0; i--) {
      if (currentPath.charAt(i) === '/') {
        lastSlash = i;
        break;
      }
    }
    if (lastSlash <= 0) {
      this.paths.push("/");
    } else {
      this.paths.push(currentPath.substring(0, lastSlash));
    }
    this.openPath();
  },
  onGoBackClick(){
    if (this.paths.length > 1){
      this.paths.pop();
      this.openPath();
    }
  },
  onGoClick(item) {
    this.paths.push(this.paths[this.paths.length - 1] + "/" + item.uri);
    this.openPosition = 0;
    this.openPath();
  },
  onPrevPageClick(){
    this.openPosition -= this.pageSize;
    this.openPath();
  },
  onNextPageClick(){
    this.openPosition += this.pageSize;
    this.openPath();
  },
  onPageSwipe(data) {
    switch (data.direction) {
      case "up":
        this.showTitle = false;
        break;
      case "down":
        this.showTitle = true;
        break;
      default:
        break;
    }
  },
  openPath(){
    const currentPath = `internal://app\\\\..\\\\..\\\\..\\\\..${this.paths[this.paths.length - 1]}`;
    file.get({
      uri: currentPath,
      success: d => {
        switch (d.type) {
          case "dir": {
              file.list({
                uri: currentPath,
                success: d => {
                  this.clearData();
                  this.fileType = "folder";
                  this.files = d.fileList;
                },
                fail: this.showFailData
              });
              break;
            }
          case "file": {
            const fileExt = d.uri.split(".").slice(-2).join(".");
            switch (fileExt) {
              case "png.mp3": {
                file.copy({
                  srcUri: currentPath,
                  dstUri: "internal://app/image.png",
                  success: ()=>{
                    this.clearData();
                    this.fileType = "image";
                  },
                  fail: this.showFailData
                })
                break;
              }
              default: {
                if (this.openPosition < 0) this.openPosition = 0;
                else if (this.openPosition > d.length) this.openPosition = d.length;
                file.readText({
                  uri: currentPath,
                  position: this.openPosition,
                  length: this.pageSize,
                  success: d => {
                    this.clearData();
                    this.fileType = "text";
                    this.fileContent = d.text;
                  },
                  fail: this.showFailData
                });
                break;
              }
            }
            break;
          }
          default:
            break;
        }
      },
      fail: this.showFailData
    });
  },
  clearData(){
    this.fileType = "";
    this.files = [];
    this.fileContent = "";
  },
  showFailData(data, code){
    this.clearData();
    this.fileType = "fail";
    let failData = `${code} ${data}`;
    if(failData === "300 I/O error") failData += "\n(可能是空文件夹)";
    this.fileContent = failData;
    this.showTitle = true;
  },
  getListItemBgColor(i){
    const bgc = i.type === 'dir' ? '#ffa' : ( i.type === 'file' ? '#aaf' : '#fff');
    // throw new Error(bgc);
    return bgc
  },
  onLeftSideSwipe(e) {
    if (e.direction === "right"){
      if(this.showLeftSideSwipe){
        app.terminate();
      } else{
        this.showLeftSideSwipe = true;
        this.leftSideSwipeTimeout = setTimeout(()=>{
          this.showLeftSideSwipe = false;
        },1200);
      }
    }
  },
  onBottomSideSwipe(e){
    if (e.direction === "up"){
      if(this.showBottomSideSwipe){
        router.replace({uri: "/pages/about/about"});
      } else{
        this.showBottomSideSwipe = true;
        this.bottomSideSwipeTimeout = setTimeout(()=>{
          this.showBottomSideSwipe = false;
        },1200);
      }
    }
  },
}
