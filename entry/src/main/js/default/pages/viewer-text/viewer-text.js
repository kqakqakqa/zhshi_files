import file from "@system.file";
import brightness from "@system.brightness";

import UiSizes from "../../UiSizes.js";
import HeaderTimeBattery from "../../HeaderTimeBattery.js";
import Router from "../../Router.js";

export default {
  data: {
    uiSizes: { screenWidth: 0, screenHeight: 0 },
    uiRefresh: false,
    timeBatteryStr: "",
    paths: [""],
    fileContent: "",
    openPosition: 0,
    atStart: false,
    atEnd: false,
    showTitle: true,
    fileType: "",
    failData: "",
  },
  onInit() {
    UiSizes.init(data => {
      this.uiSizes = data;
      this.uiRefresh = true;
    });
    HeaderTimeBattery.subscribe(data => {
      this.timeBatteryStr = data.time + "  " + data.battery;
    });
    brightness.setKeepScreenOn({
      keepScreenOn: true,
    });
    this.openPath();
  },
  onDestroy() {
    brightness.setKeepScreenOn({
      keepScreenOn: false,
    });
  },
  openPath(direction) {
    const currentPath = "internal://app" + this.paths.join("");
    file.get({
      uri: currentPath,
      success: f => {
        const oldPosition = this.openPosition;
        if (direction === "prev") {
          this.openPosition -= maxBytes;
        } else if (direction === "next") {
          this.openPosition += getByteLength(this.fileContent);
        }
        let readLen = maxBytes;
        if (this.openPosition <= 0) {
          this.openPosition = 0;
          if (direction === "prev") readLen = oldPosition;
        } else if (this.openPosition >= f.length) {
          this.openPosition = oldPosition;
          this.atEnd = true;
        } else {
          this.atStart = false;
          this.atEnd = false;
        }
        file.readArrayBuffer({
          uri: currentPath,
          position: this.openPosition,
          length: readLen,
          success: d => {
            this.fileType = "text";
            const text = replaceCRLF2LF(safeDecodeUTF8(d.buffer));
            if (direction !== "prev") {
              this.fileContent = getOnePageSlice(text);
            } else {
              // this.fileContent = getOnePageSlice(text)
              this.fileContent = getOnePageSlice(text.split("").reverse().join("")).split("").reverse().join("");
              this.openPosition += maxBytes - getByteLength(this.fileContent);
            }
            if (this.openPosition + getByteLength(this.fileContent) >= f.length) {
              this.atEnd = true;
            }
            if (this.openPosition <= 0) {
              this.atStart = true;
            }
            return;
          },
          fail: this.showFailData
        });
        return;
      },
      fail: this.showFailData,
    });
  },
  showFailData(data, code = "") {
    this.fileType = "fail";
    this.failData = code + " " + data;
  },
  onGoBackClick() {
    this.paths.pop();
    return Router.replace({
      uri: "pages/viewer-dir/viewer-dir",
      params: { paths: this.paths },
    });
  },
  onPrevPageClick() {
    this.openPath("prev");
  },
  onNextPageClick() {
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
}

const maxChars = 80;
const maxBytes = 320;
const maxLines = 8;

function getByteLength(str) {
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
}

function getOnePageSlice(str) {
  let result = "";
  let charCount = 0;
  let lineCount = 0;
  let currentLineLength = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    result += char;
    charCount++;
    currentLineLength++;
    if (currentLineLength >= maxChars / maxLines) {
      lineCount++;
      currentLineLength = 0;
    } else if (char === "\n") {
      lineCount += 2;
      currentLineLength = 0;
    }
    if (
      charCount >= maxChars ||
      lineCount > maxLines
    ) break;
  }
  return result;
}

function replaceCRLF2LF(str) {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str[i] === "\r" ? "\x1F" : str[i];
  }
  return result;
}

function safeDecodeUTF8(bytes) {
  let result = "";
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
}