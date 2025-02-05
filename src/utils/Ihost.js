/**
 * Cache for ihost list data.
 */
function IhostListCache() {
    // Cache data
    this.ihostList = [];
}

/**
 * Get cache size.
 */
IhostListCache.prototype.size = function () {
    return this.ihostList.length;
};

/**
 * Get node data index.
 *
 * @param {string} ip node ip
 */
IhostListCache.prototype.index = function (ip) {
    const i = this.ihostList.findIndex((item) => item.ip === ip);
    return i;
};

/**
 * Check node data existence.
 *
 * @param {string} ip node ip
 */
IhostListCache.prototype.has = function (ip) {
    const i = this.index(ip);
    return i !== -1;
};

/**
 * Add a new node data to cache.
 *
 * @param {*} node node data
 */
IhostListCache.prototype.add = function (node) {
    /*
    if (!this.has(node.ip)) {
        this.ihostList.push(node);
    }
    */

    const i = this.ihostList.findIndex((item) => item.name === node.name);
    if (i === -1) {
        this.ihostList.push(node);
    } else {
        // replace old IP and name
        this.ihostList[i].ip = node.ip;
        this.ihostList[i].name = node.name;
    }
    // console.log('iHost gateway info list:', JSON.stringify(this.ihostList));
};

/**
 * Remove a node data from cache.
 *
 * @param {string} id node id
 */
IhostListCache.prototype.remove = function (ip) {
    const i = this.index(ip);
    if (i !== -1) {
        this.ihostList.splice(i, 1);
    }
};

/**
 * Get node data by id.
 *
 * @param {string} id node id
 */
IhostListCache.prototype.getNodeData = function (ip) {
    const i = this.index(ip);
    if (i === -1) {
        return null;
    } else {
        return this.ihostList[i];
    }
};

/**
 * Clean cache.
 */
IhostListCache.prototype.clean = function () {
    this.ihostList = [];
};

module.exports = {
    IhostListCache
};
