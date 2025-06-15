import file from '@system.file';
import app from '@system.app';

export default {
  data: {
    paths: ["//app"],
    files: [],
    failData: "",
    fileContent: "",
    showLeftSideSwipe: false,
    leftSideSwipeTimeout:null,
  },
  onInit() {
    this.openPath();
  },
  onGoParentClick(){
    const currentPath = this.paths[this.paths.length - 1];
    if(this.paths.length === 1 || currentPath.slice(-4) === "\\\\.."){
      this.paths.push(currentPath + "\\\\..");
    } else {
      return this.onGoBackClick();
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
    this.openPath();
  },
  openPath(){
    const currentPath = `internal:${this.paths[this.paths.length - 1]}`;
    file.get({
      uri: currentPath,
      success: d => {
        if (d.type === "dir") {
          file.list({
            uri: currentPath,
            success: d => {
              this.clearData();
              this.files = d.fileList;
            },
            fail: this.showFailData
          });
        } else if (d.type === "file") {
          file.readText({
            uri: currentPath,
            success: d => {
              this.clearData();
              this.fileContent = d.text;
            },
            fail: this.showFailData
          })
        }
      },
      fail: this.showFailData
    });
  },
  clearData(){
    this.files = [];
    this.failData = "";
    this.fileContent = "";
  },
  showFailData(data, code){
    this.files = [];
    this.failData = `${code} ${data}`;
    this.fileContent = "";
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
}
