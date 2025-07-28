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
    showBottomSideSwipe: false,
    leftSideSwipeTimeout: null,
    bottomSideSwipeTimeout: null,
    deviceStatus: "",
    openPosition: 0,
    atStartEnd: undefined,
    maxChars: 80,
    maxBytes: 324,
    maxLines: 8,
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
          const batteryStatus = `${data.charging ? "充电中" : `${data.level*100}%`}`;
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
    this.openPath("prev");
  },
  onNextPageClick(){
    this.openPath("next");
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
  openPath(positionDirection){
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
              case "bmp.mp3":
              case "jpg.mp3":
              case "png.mp3": {
                this.clearData();
                this.fileType = "image";
                // file.copy({
                //   srcUri: currentPath,
                //   dstUri: "internal://app/image.png",
                //   success: ()=>{
                //     this.clearData();
                //     this.fileType = "image";
                //   },
                //   fail: this.showFailData
                // })
                break;
              }
              default: {
                switch (positionDirection) {
                  case "prev":{
                    this.openPosition -= this.maxBytes;
                    break;
                  }
                  case "next":{
                    this.openPosition += this.getByteLength(this.fileContent);
                    break;
                  }
                  default:{
                    break;
                  }
                }
                if(this.openPosition <= 0) {
                  this.openPosition = 0;
                  positionDirection = undefined;
                  this.atStartEnd = "start";
                } else if(this.openPosition>=d.length) {
                  this.openPosition = d.length;
                  this.atStartEnd = "end";
                } else {
                  this.atStartEnd = undefined;
                }
                file.readArrayBuffer({
                  uri: currentPath,
                  position: this.openPosition,
                  length: this.maxBytes,
                  success: d => {
                    const text = this.replaceCRLF2LF(this.safeDecodeUTF8(d.buffer));
                    this.clearData();
                    this.fileType = "text";
                    switch (positionDirection) {
                      case "prev":{
                        // this.fileContent = this.getOnePageSlice(text)
                        this.fileContent = this.getOnePageSlice(text.split("").reverse().join("")).split("").reverse().join("");
                        this.openPosition += this.maxBytes - this.getByteLength(this.fileContent);
                        break;
                      }
                      default:{
                        this.fileContent = this.getOnePageSlice(text);
                        break;
                      }
                    }
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
  getByteLength(str) {
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code <= 0x7F) {
        byteLength += 1;
      } else if (code <= 0x7FF) {
        byteLength += 2;
      } else if (code >= 0xD800 && code <= 0xDBFF) { // 高位代理
        byteLength += 4;
        i++;
      } else if (code >= 0xDC00 && code <= 0xDFFF) { // 低位代理，一般不单独出现的
        continue;
      } else {
        byteLength += 3;
      }
    }
    return byteLength;
  },
  getOnePageSlice(str) {
    let result = "";
    let charCount = 0;
    let lineCount = 0;
    let currentLineLength = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      result += char;
      charCount++;
      currentLineLength++;
      if (currentLineLength >= this.maxChars / this.maxLines) {
        lineCount++;
        currentLineLength = 0;
      } else if (char === "\n") {
        lineCount+=2;
        currentLineLength = 0;
      }
      if (
        charCount >= this.maxChars ||
        lineCount > this.maxLines
      ) break;
    }
    return result;
  },
  replaceCRLF2LF(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      result += str[i] === "\r" ? "\x1F" : str[i];
    }
    return result;
  },
  safeDecodeUTF8(bytes) {
    let result = '';
    let i = 0;

    while (i < bytes.length) {
      const byte1 = bytes[i];

      if (byte1 <= 0x7F) {
        // 1字节字符（ASCII）
        result += String.fromCharCode(byte1);
        i += 1;
      } else if (byte1 >= 0xC2 && byte1 <= 0xDF) {
        // 2字节字符
        if (i + 1 < bytes.length) {
          const byte2 = bytes[i + 1];
          if ((byte2 & 0xC0) === 0x80) {
            const codePoint = ((byte1 & 0x1F) << 6) | (byte2 & 0x3F);
            result += String.fromCharCode(codePoint);
            i += 2;
            continue;
          }
        }
        i += 1; // 不合法，跳过 byte1
      } else if (byte1 >= 0xE0 && byte1 <= 0xEF) {
        // 3字节字符
        if (i + 2 < bytes.length) {
          const byte2 = bytes[i + 1];
          const byte3 = bytes[i + 2];
          if ((byte2 & 0xC0) === 0x80 && (byte3 & 0xC0) === 0x80) {
            const codePoint = ((byte1 & 0x0F) << 12) |
            ((byte2 & 0x3F) << 6) |
            (byte3 & 0x3F);
            result += String.fromCharCode(codePoint);
            i += 3;
            continue;
          }
        }
        i += 1; // 不合法，跳过 byte1
      } else if (byte1 >= 0xF0 && byte1 <= 0xF4) {
        // 4字节字符（可能会超出 BMP 需要 surrogate pair）
        if (i + 3 < bytes.length) {
          const byte2 = bytes[i + 1];
          const byte3 = bytes[i + 2];
          const byte4 = bytes[i + 3];
          if ((byte2 & 0xC0) === 0x80 &&
          (byte3 & 0xC0) === 0x80 &&
          (byte4 & 0xC0) === 0x80) {
            const codePoint = ((byte1 & 0x07) << 18) |
            ((byte2 & 0x3F) << 12) |
            ((byte3 & 0x3F) << 6) |
            (byte4 & 0x3F);
            // surrogate pair
            const high = ((codePoint - 0x10000) >> 10) + 0xD800;
            const low = ((codePoint - 0x10000) & 0x3FF) + 0xDC00;
            result += String.fromCharCode(high, low);
            i += 4;
            continue;
          }
        }
        i += 1; // 不合法，跳过 byte1
      } else {
        // 非法起始字节
        i += 1;
      }
    }

    return result;
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
