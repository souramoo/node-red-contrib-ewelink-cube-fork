// /**
//  * Cache for deivce state data.
//  */
// function DeviceStateCache() {
//     // Cache data
//     this.deviceState = [];
// }

// /**
//  * Get cache size.
//  */
// DeviceStateCache.prototype.size = function () {
//     return this.deviceState.length;
// };

// /**
//  * Get node data index.
//  *
//  * @param {string} id node id
//  */
// DeviceStateCache.prototype.index = function (id) {
//     const i = this.deviceState.findIndex((item) => item.id === id);
//     return i;
// };

// /**
//  * Check node data existence.
//  *
//  * @param {string} id node id
//  */
// DeviceStateCache.prototype.has = function (id) {
//     const i = this.index(id);
//     return i !== -1;
// };

// /**
//  * Add a new node data to cache.
//  *
//  * @param {*} node node data
//  */
// DeviceStateCache.prototype.add = function (node) {
//     if (!this.has(node.id)) {
//         this.deviceState.push(node);
//     }
// };


// /**
//  * modify data to cache.
//  * @param {*} node node data
//  */
// DeviceStateCache.prototype.modify = function (node) {
//     if (this.has(node.id)) {
//         const idx = this.index(node.id);
//         this.deviceState[idx] = node;
//     }
// };


// /**
//  * Remove a node data from cache.
//  *
//  * @param {string} id node id
//  */
// DeviceStateCache.prototype.remove = function (id) {
//     const i = this.index(id);
//     if (i !== -1) {
//         this.deviceState.splice(i, 1);
//     }
// };

// /**
//  * Get node data by id.
//  *
//  * @param {string} id node id
//  */
// DeviceStateCache.prototype.getNodeData = function (id) {
//     const i = this.index(id);
//     if (i === -1) {
//         return null;
//     } else {
//         return this.deviceState[i];
//     }
// };

// /**
//  * Clean cache.
//  */
// DeviceStateCache.prototype.clean = function () {
//     this.deviceState = [];
// };

// module.exports = {
//     DeviceStateCache
// };

class DeviceStateCache{
    deviceState = [];

    constructor(deviceState){
        this.deviceState = deviceState;
    }

    getData(){
        return this.deviceState;
    }

    add(node){
        if (!this.has(node.id)) {
            this.deviceState.push(node);
        }
    }

    has(id){
        const i = this.index(id);
        return i !== -1;
    }

    index(id){
        const i = this.deviceState.findIndex((item) => item.id === id);
        return i;
    }

    modify(node){
        if (this.has(node.id)) {
            const idx = this.index(node.id);
            this.deviceState[idx] = node;
        }
    }

    getNodeData(id){
        const i = this.index(id);
        if (i === -1) {
            return null;
        } else {
            return this.deviceState[i];
        }
    }

    clean(){
        this.deviceState = [];
    }
}

module.exports = {
    DeviceStateCache
};
