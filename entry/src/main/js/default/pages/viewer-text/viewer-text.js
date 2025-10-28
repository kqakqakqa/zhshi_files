console.info("pages/viewer-text/viewer-text onInit");

let maxLines = getMaxLines($app.getImports().UiSizes.uiHeight);
let maxCharsInLine = getMaxCharsInLine($app.getImports().UiSizes.uiWidth);
const maxBytes = 512;

let fileLen = 0;
let pageLen = 0;
let uriPath;
let openPosition = 0;

function getMaxLines(h) {
  if (h == 360) return 9;
  if (h == 396) return 10;
  if (h == 276) return 7;
  if (h == 306) return 8;
  return 7;
}

function getMaxCharsInLine(w) {
  if (w == 276) return 9;
  if (w == 336) return 11;
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
        if ((byte2 & 0xC0) == 0x80) {
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
        if ((byte2 & 0xC0) == 0x80 && (byte3 & 0xC0) == 0x80) {
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
        if ((byte2 & 0xC0) == 0x80 &&
          (byte3 & 0xC0) == 0x80 &&
          (byte4 & 0xC0) == 0x80) {
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

export default {
  data: {
    uiSizes: $app.getImports().UiSizes,
    timeBatteryStr: "",
    fileName: $app.getImports().paths.paths[$app.getImports().paths.paths.length - 1].split("/")[1],
    page: "",
    pageLines: [],
    progress: "",
    hasPrev: false,
    hasNext: true,
    showTitle: true,
    failData: "",
  },
  onInit() {
    uriPath = "internal://app" + $app.getImports().paths.paths.join("");
    $app.getImports().HeaderTimeBattery.subscribe(() => {
      this.timeBatteryStr = $app.getImports().HeaderTimeBattery.time + "  " + $app.getImports().HeaderTimeBattery.battery;
    });
    $app.getImports().brightness.setKeepScreenOn({
      keepScreenOn: true,
    });
    $app.getImports().file.get({
      uri: uriPath,
      success: f => {
        fileLen = f.length;
        this.readPage("next");
      },
      fail: this.showFailData,
    });
  },
  onDestroy() {
    $app.getImports().brightness.setKeepScreenOn({
      keepScreenOn: false,
    });
    $app.getImports().HeaderTimeBattery.subscribe(undefined);
  },
  readPage(direction) {
    console.log("old position: " + openPosition + "/" + fileLen);
    console.log("readPage: " + direction);
    const oldPosition = openPosition;
    let readLen;
    if (direction == "prev") {
      if (!this.hasPrev) return;
      openPosition = Math.max(openPosition - maxBytes, 0);
      readLen = oldPosition - openPosition;
    } else if (direction == "next") {
      if (!this.hasNext) return;
      openPosition += pageLen;
      if (openPosition >= fileLen) openPosition = oldPosition;
      readLen = maxBytes;
    }
    console.log("read position: " + openPosition + "/" + fileLen);
    console.log("readLen: " + readLen);
    $app.getImports().file.readArrayBuffer({
      uri: uriPath,
      position: openPosition,
      length: readLen,
      success: d => {
        this.failData = "";
        const text = safeDecodeUTF8(d.buffer);
        if (direction == "prev") {
          this.sliceToPage(text.split("").reverse().join(""));
          this.page = this.page.split("").reverse().join("");
          openPosition = oldPosition - pageLen;
          // if (openPosition > 0 && openPosition < 3) { // bug fix
          //   openPosition = 0;
          //   pageLen = 0;
          //   return this.readPage("next");
          // }
        } else if (direction == "next") {
          this.sliceToPage(text);
        }
        // console.warn(`read: ${JSON.stringify(text)} (${readLen}), sliced: ${JSON.stringify(this.page)} (${pageLen})`);
        console.log("new position: " + openPosition + "/" + fileLen);
        console.log("pageLen: " + pageLen);
        this.pageLines = this.page.split("\n");
        this.hasNext = openPosition + pageLen < fileLen - 1; // bug fix
        this.hasPrev = openPosition > 0 + 1; // bug fix
        this.progress = (!this.hasNext && !this.hasPrev) ? "--" :
          !this.hasNext ? "100" :
            !this.hasPrev ? "0" :
              (openPosition / fileLen * 100).toFixed(2);
      },
      fail: this.showFailData,
    });
  },
  sliceToPage(str) {
    this.page = "";
    let lineCount = 1;
    let charInLineCount = 0;
    pageLen = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charWidth = estimateCharWidth(char);
      charInLineCount += charWidth;
      if (char == "\r") {
        pageLen += getByteLen(char);
        continue;
      }
      if (char == "\n") {
        pageLen += getByteLen(char);
        lineCount++;
        if (lineCount > maxLines) break;
        this.page += "\n";
        charInLineCount = 0;
        continue;
      }
      if (charInLineCount > maxCharsInLine) {
        lineCount++;
        if (lineCount > maxLines) break;
        this.page += "\n" + char;
        charInLineCount = charWidth;
        pageLen += getByteLen(char);
        continue;
      }
      this.page += char;
      pageLen += getByteLen(char);
    }
  },
  showFailData(data, code = undefined) {
    this.failData = code + " " + data;
  },
  nullFn() { },
  onGoBackClick() {
    $app.getImports().paths.paths.pop();
    return $app.getImports().Router.replace({ uri: "pages/viewer-dir/viewer-dir" });
  },
  onPrevPageClick() {
    this.readPage("prev");
  },
  onNextPageClick() {
    this.readPage("next");
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
        this.readPage("next");
        break;
      case "right":
        this.readPage("prev");
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