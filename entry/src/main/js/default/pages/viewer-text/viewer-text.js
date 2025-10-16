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
    paths: [],
    path: "",
    maxLines: 0,
    maxCharsInLine: 0,
    fileLen: 0,
    page: "",
    showPage: [],
    pageLen: 0,
    openPosition: 0,
    progress: 0,
    atStart: false,
    atEnd: false,
    showTitle: true,
    fileType: "",
    failData: "",
  },
  onInit() {
    UiSizes.init(data => {
      this.uiSizes = data;
      this.maxLines = getMaxLines(data.uiHeight);
      this.maxCharsInLine = getMaxCharsInLine(data.uiWidth);
      this.uiRefresh = true;
    });
    HeaderTimeBattery.subscribe(data => {
      this.timeBatteryStr = data.time + "  " + data.battery;
    });
    brightness.setKeepScreenOn({
      keepScreenOn: true,
    });
    this.initOpenPath();
  },
  onDestroy() {
    brightness.setKeepScreenOn({
      keepScreenOn: false,
    });
  },
  initOpenPath() {
    this.path = "internal://app" + this.paths.join("");
    file.get({
      uri: this.path,
      success: f => {
        this.fileLen = f.length;
        this.openPath();
      },
      fail: this.showFailData,
    });
  },
  openPath(direction) {
    const oldPosition = this.openPosition;
    if (direction === "prev") {
      this.openPosition -= maxBytes;
    } else if (direction === "next") {
      this.openPosition += this.pageLen;
    }
    let readLen = maxBytes;
    if (this.openPosition <= 0) {
      this.openPosition = 0;
      if (direction === "prev") readLen = oldPosition;
    } else if (this.openPosition >= this.fileLen) {
      this.openPosition = oldPosition;
      this.atEnd = true;
    } else {
      this.atStart = false;
      this.atEnd = false;
    }
    file.readArrayBuffer({
      uri: this.path,
      position: this.openPosition,
      length: readLen,
      success: d => {
        this.fileType = "text";
        const text = safeDecodeUTF8(d.buffer);
        if (direction === "prev") {
          this.sliceToPage(text.split("").reverse().join(""));
          this.page = this.page.split("").reverse().join("");
          this.showPage = this.page.split("\n");
          this.openPosition += readLen - this.pageLen;
        } else {
          this.sliceToPage(text);
          this.showPage = this.page.split("\n");
        }
        if (this.openPosition + this.pageLen >= this.fileLen) {
          this.atEnd = true;
        }
        if (this.openPosition <= 0) {
          this.atStart = true;
        }
        this.progress = this.atEnd ? 100 : this.atStart ? 0 : Number((this.openPosition / this.fileLen * 100).toFixed(2));
        return;
      },
      fail: this.showFailData
    });
    return;
  },
  sliceToPage(str) {
    this.page = "";
    let lineCount = 1;
    let charInLineCount = 0;
    this.pageLen = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charWidth = estimateCharWidth(char);
      charInLineCount += charWidth;
      if (char === "\r") {
        this.pageLen += getByteLen(char);
        continue;
      }
      if (char === "\n") {
        this.pageLen += getByteLen(char);
        lineCount++;
        if (lineCount > this.maxLines) break;
        this.page += "\n";
        charInLineCount = 0;
        continue;
      }
      if (charInLineCount > this.maxCharsInLine) {
        lineCount++;
        if (lineCount > this.maxLines) break;
        this.page += "\n" + char;
        charInLineCount = charWidth;
        this.pageLen += getByteLen(char);
        continue;
      }
      this.page += char;
      this.pageLen += getByteLen(char);
    }
  },
  showFailData(data, code = undefined) {
    this.fileType = "fail";
    this.failData = code + " " + data;
  },
  nullFn() { },
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
      case "top":
        this.showTitle = false;
        break;
      case "down":
      case "bottom":
        this.showTitle = true;
        break;
      case "left":
        this.openPath("next");
        break;
      case "right":
        this.openPath("prev");
        break;
      default:
        break;
    }
  },
  onTitleClick() {
    this.showTitle = !this.showTitle;
  },
  onTitleSwipe(data) {
    switch (data.direction) {
      case "up":
      case "top":
        this.showTitle = false;
        break;
      case "down":
      case "bottom":
        this.showTitle = true;
        break;
      default:
        break;
    }
  },
}

const maxBytes = 512;

function getMaxLines(h) {
  if (h === 360) return 9;
  if (h === 396) return 10;
  if (h === 276) return 7;
  if (h === 306) return 8;
  return 7;
}

function getMaxCharsInLine(w) {
  if (w === 276) return 9;
  if (w === 336) return 11;
  return 9;
}

function getByteLen(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7F || (code >= 0xD800 && code <= 0xDBFF)) len += 1; // ASCII字符、高位代理
    else if (code <= 0x7FF) len += 2;
    else len += 3; // 普通BMP字符、低位代理
  }
  return len;
}

function estimateCharWidth(char) {
  const code = char.charCodeAt(0);
  if ("\r\n\x1F".indexOf(char) >= 0) return 0;
  if (code >= 0x20 && code <= 0x7E) {
    if ("Il,.'`!:; ".indexOf(char) >= 0) return 0.25;
    else if ("MmWw@#%&".indexOf(char) >= 0) return 1;
    else return 0.75;
  }
  return 1;
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