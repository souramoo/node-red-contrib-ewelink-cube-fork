/** 比较版本号是否大于等于指定的版本号 (Compares whether the version number is greater than or equal to the specified version number) */
function isVersionGreaterOrEqual(version, targetVersion) {
  try {
    // 将版本号字符串拆分为数组，例如 '2.0.0' -> [2, 0, 0]
    const versionParts = version.split(".").map(Number);
    const targetParts = targetVersion.split(".").map(Number);

    // 比较版本号的每个部分
    for (let i = 0; i < versionParts.length; i++) {
      if (versionParts[i] > targetParts[i]) {
        return true; // 当前版本号大于目标版本号
      } else if (versionParts[i] < targetParts[i]) {
        return false; // 当前版本号小于目标版本号
      }
      // 如果相等，继续比较下一个部分
    }

    // 如果所有部分都相等，则认为版本号相等或者目标版本号是当前版本号的前缀
    return true;
  } catch (error) {
    return false;
  }
}

async function sleepSeconds(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, seconds * 1000);
  });
}

async function sleepMillisecond(millisecond) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, millisecond);
  });
}

function convertHexToRgb(colorStr) {
  var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  var sColor = colorStr.toLowerCase();
  if (sColor && reg.test(sColor)) {
    if (sColor.length === 4) {
      var sColorNew = "#";
      for (var i = 1; i < 4; i += 1) {
        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
      }
      sColor = sColorNew;
    }
    var sColorChange = [];
    for (var i = 1; i < 7; i += 2) {
      sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
    }
    return "rgb(" + sColorChange.join(",") + ")";
  } else {
    return sColor;
  }
}

module.exports = {
  isVersionGreaterOrEqual,
  sleepSeconds,
  convertHexToRgb,
  sleepMillisecond,
};
