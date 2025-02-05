function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
}

function isNullObject(obj) {
    return Object.keys(obj).length === 0;
}

function hyphenToCamel(word) {
    const str = word.charAt(0).toUpperCase() + word.slice(1);
    return str.replace(/-([a-z])/g, function (match, char) {
        return char.toUpperCase();
    });
}

function loadshGet(obj, path) {
    return (
        path.reduce((o, k) => {
            return (o || {})[k];
        }, obj) || undefined
    );
}

function isObject(value) {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}

function merge(source, other) {
    if (!isObject(source) || !isObject(other)) {
        return other === undefined ? source : other;
    }
    // 合并两个对象的 key，另外要区分数组的初始值为 []
    return Object.keys({
        ...source,
        ...other,
    }).reduce(
        (acc, key) => {
            // 递归合并 value
            acc[key] = merge(source[key], other[key]);
            return acc;
        },
        Array.isArray(source) ? [] : {}
    );
}

function omit(source, keys) {
    return Object.keys(source).reduce((target, nowKey) => {
        if (!keys.includes(nowKey)) target[nowKey] = source[nowKey];
        return target;
    }, {});
}

function rgbToHsv(r1, g1, b1) {
    let rdif;
    let gdif;
    let bdif;
    let h;
    let s;

    const r = r1 / 255;
    const g = g1 / 255;
    const b = b1 / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function (c) {
        return (v - c) / 6 / diff + 1 / 2;
    };

    if (diff === 0) {
        h = 0;
        s = 0;
    } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);

        if (r === v) {
            h = bdif - gdif;
        } else if (g === v) {
            h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
            h = 2 / 3 + gdif - rdif;
        }

        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }

    return [h * 360, s * 100, v * 100];
}

function hsvToRgb(h1, s1, v1) {
    const h = h1 / 60;
    const s = s1 / 100;
    let v = v1 / 100;
    const hi = Math.floor(h) % 6;

    const f = h - Math.floor(h);
    const p = 255 * v * (1 - s);
    const q = 255 * v * (1 - s * f);
    const t = 255 * v * (1 - s * (1 - f));
    v *= 255;

    switch (hi) {
        case 0:
            return [v, t, p];
        case 1:
            return [q, v, p];
        case 2:
            return [p, v, t];
        case 3:
            return [p, q, v];
        case 4:
            return [t, p, v];
        case 5:
            return [v, p, q];
    }
}

function compareVersion(versionA, versionB) {
    if (versionA === versionB) {
        return 0;
    }
    const arrayA = versionA.split('.');
    const arrayB = versionB.split('.');
    for (let i = 0; ; i++) {
        const numA = parseInt(arrayA[i]);
        const numB = parseInt(arrayB[i]);
        if (numA !== numB) {
            return numA - numB;
        }
    }
}
