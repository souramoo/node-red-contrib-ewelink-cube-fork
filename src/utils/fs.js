const fs = require('fs');
const path = require('path');

const DATA_DIR = '/data';
const CACHE_DIR = '/data/ewelink-cube-cache';

// Check if the file path exists. Returns true if it exists, otherwise false.
function isFileExist(filepath) {
    try {
        fs.accessSync(filepath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

// Try to create a directory. Returns true if success, otherwise false.
function mkdir(dirpath) {
    try {
        fs.mkdirSync(dirpath, { recursive: true });
        return true;
    } catch (err) {
        return false;
    }
}

// Try to init cache directory. Returns true if success, otherwise false.
function initCacheDir() {
    if (!isFileExist(DATA_DIR)) {
        return false;
    }

    if (isFileExist(CACHE_DIR)) {
        return true;
    }

    if (mkdir(CACHE_DIR)) {
        return true;
    } else {
        return false;
    }
}

// Get cache file path.
function getCacheFilepath(filename) {
    return path.join(CACHE_DIR, filename);
}

// Try to remove a cache file.
function removeCacheFile(filepath) {
    try {
        if (isFileExist(filepath)) {
            fs.rmSync(filepath, { recursive: true });
        }
    } catch (err) {
        console.error(err);
    }
}

// Try to write a cache file.
function writeCacheFile(filepath, content) {
    try {
        fs.writeFileSync(filepath, content);
    } catch (err) {
        console.error(err);
    }
}

// Try to read a cache file.
function readCacheFile(filepath) {
    try {
        if (isFileExist(filepath)) {
            const content = fs.readFileSync(filepath);
            return content.toString();
        }
    } catch (err) {
        console.error(err);
    }
}

// Try to get all cache file name.
function getAllCacheFileName() {
    try {
        return fs.readdirSync(CACHE_DIR);
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    isFileExist,
    mkdir,
    initCacheDir,
    removeCacheFile,
    writeCacheFile,
    readCacheFile,
    getCacheFilepath,
    getAllCacheFileName,
};
