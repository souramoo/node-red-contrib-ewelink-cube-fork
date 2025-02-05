const { eventBridge } = require('./utils/event');
const { EVENT_SSE_ON_UPDATE_DEVICE_STATE, EVENT_SSE_SECURITY_CHANGE, EVENT_SSE_ALARM_CHANGE } = require('./utils/const');
const { DeviceStateCache } = require('./utils/state');
const { API_URL_GET_DEVICE_LIST } = require('./utils/const');
const axios = require('axios');
const _ = require('lodash');
const { isFileExist, initCacheDir, getCacheFilepath, readCacheFile, removeCacheFile, writeCacheFile } = require('./utils/fs');

/**
 * Determine if payload is updated.
 * @param {object} cp cache payload
 * @param {object} np new payload
 */
function isDeviceStateUpdated(cp, np) {
    let updated = false;
    Object.keys(np).forEach((key) => {
        const nv = np[key];
        const cv = cp[key];
        if (!cv || JSON.stringify(cv) !== JSON.stringify(nv)) {
            updated = true;
            cp[key] = nv;
        }
    });
    return updated;
}

/**
 * Determine if device data is duplicated.
 * @param {object} stateCache device state cache
 * @param {object} deviceData device data
 */
function isDuplicateData(stateCache, deviceData) {
    const serialNumber = deviceData.endpoint.serial_number;
    const payload = deviceData.payload;
    const i = stateCache.findIndex((item) => item.serialNumber === serialNumber);
    let duplicated = false;

    if (i === -1) {
        stateCache.push({
            serialNumber,
            payload,
        });
    } else if (!isDeviceStateUpdated(stateCache[i].payload, payload)) {
        duplicated = true;
    }

    return duplicated;
}

module.exports = function (RED) {
    function GetStateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const deviceStateCache = new DeviceStateCache([]);
        let trvStateNodeContext = new Map();

        // All of devices state cache.
        // SAMPLE:
        // [
        //     {
        //         "serialNumber": "...",
        //         "payload": {
        //             "key1": {},
        //             "key2": {}
        //         }
        //     }
        // ]
        node.deviceStateCache = [];
        const stateCacheFile = `${node.id}_devstat`;
        const stateCachePath = getCacheFilepath(stateCacheFile);
        if (initCacheDir() && isFileExist(stateCachePath)) {
            try {
                const content = readCacheFile(stateCachePath);
                node.deviceStateCache = JSON.parse(content);
            } catch (err) {
                node.error('set device state cache error:', err);
            }
        }

        async function eventSseOnAllStateDeviceHandler(jsonData) {
            try {
                node.log(`NEW SSE COMING :${JSON.stringify(jsonData)}`);
                const data = JSON.parse(jsonData);

                /* TODO: release the following code after next version
                if (isDuplicateData(node.deviceStateCache, JSON.parse(data.msg.data))) {
                    return;
                }
                */

                if (config.server === data.srcNodeId) {
                    const deviceData = JSON.parse(data.msg.data);
                    const playload = JSON.parse(JSON.stringify(deviceData.payload));
                    const stateList = (config.state + ',' + config.list).split(',');

                    if (config.device === 'all' || !config.device) {
                        node.send({ payload: data.msg.data });
                        return;
                    }

                    if (config.device === deviceData.endpoint.serial_number && (config.state || config.list)) {
                        const deviceId = deviceData.endpoint.serial_number;

                        /** if device category is trv ,stoping here */
                        if (config.category && config.category === 'thermostat') {
                            sendMsgRuleOfTrv(playload, data, stateList, deviceId);
                            return;
                        }

                        //旧版本选择了toggle能力的数据 (The old version selected data with toggle capability)
                        const equalToggle = stateList.some((item) => item === 'toggle');
                        if (equalToggle && Object.keys(playload).join('') === 'toggle') {
                            const tempData = JSON.parse(JSON.stringify(deviceStateCache.getData()));
                            //When initialized and entered, it is empty and directly outputs and returns.
                            if (tempData.length === 0) {
                                node.send({ payload: data.msg.data });
                                deviceStateCache.add({ id: deviceData.endpoint.serial_number, playload: playload });
                                return;
                            }
                            if (deviceStateCache.has(deviceId)) {
                                const deviceStateData = deviceStateCache.getNodeData(deviceId);
                                if (JSON.stringify(Object.values(deviceStateData.playload)) == JSON.stringify(Object.values(playload))) {
                                    deviceStateCache.clean();
                                    deviceStateCache.add({ id: deviceId, playload: playload });
                                } else {
                                    node.send({ payload: data.msg.data });
                                    deviceStateCache.modify({ id: deviceId, playload: playload });
                                }
                                return;
                            } else {
                                node.send({ payload: data.msg.data });
                                deviceStateCache.add({ id: deviceId, playload: playload });
                                return;
                            }
                        }

                        /** 普通设备和区分通道的设备 */
                        const printFlag = spacialDeviceHandler(stateList, playload);
                        const name = Object.keys(playload).join('');
                        const specialChanel = stateList.some((item) => item.indexOf('toggle') !== -1 && item.length > 6);
                        if (name === 'toggle' && specialChanel && printFlag) {
                            const tempData = JSON.parse(JSON.stringify(deviceStateCache.getData()));
                            //When initialized and entered, it is empty and directly outputs and returns.
                            if (tempData.length === 0) {
                                node.send({ payload: data.msg.data });
                                deviceStateCache.add({ id: deviceData.endpoint.serial_number, playload: playload });
                                return;
                            }

                            /** Contains toggle capability and the device ID exists in the memory
                             *  and the jsonized data will not be printed if there is no change,
                             *  but will be printed if it changes.
                             */
                            if (deviceStateCache.has(deviceId)) {
                                const deviceStateData = deviceStateCache.getNodeData(deviceId);
                                if (JSON.stringify(Object.values(deviceStateData.playload)) == JSON.stringify(Object.values(playload))) {
                                    deviceStateCache.clean();
                                    deviceStateCache.add({ id: deviceId, playload: playload });
                                } else {
                                    node.send({ payload: data.msg.data });
                                    deviceStateCache.modify({ id: deviceId, playload: playload });
                                }
                                return;
                            } else {
                                node.send({ payload: data.msg.data });
                                deviceStateCache.add({ id: deviceId, playload: playload });
                                return;
                            }
                        }

                        if (printFlag || config.state === 'all') {
                            node.send({ payload: data.msg.data });
                        }
                    }
                }
            } catch (error) {
                node.log('error:' + JSON.stringify(error));
            }
        }

        //Multi-channel devices are channel specific
        function spacialDeviceHandler(stateList, playload) {
            const KeyName = Object.keys(playload).join('');

            if (KeyName !== 'toggle') {
                // node.log(`stateList.includes(KeyName) : ${stateList.includes(KeyName)}`);
                return stateList.includes(KeyName);
            }

            let flag = false;
            for (const item of stateList) {
                // Channel equipment distinguishes specific channels
                if (KeyName === 'toggle' && item.indexOf(KeyName) !== -1) {
                    let tempName = item.substring('toggle'.length);
                    if (tempName === Object.keys(playload.toggle)[0]) {
                        flag = true;
                    }
                }
            }
            return flag;
        }

        // Send message rule of special trv device
        function sendMsgRuleOfTrv(playload, data, stateList, deviceId) {
            try {
                if (['thermostat', 'toggle'].includes(Object.keys(playload).join(''))) {
                    /** thermostat(mode 、 status) toggle(child_lock 、 open_windows_detect)  , Need to filter duplicate values */
                    // "payload":{
                    //     "toggle":{
                    //         "child-lock":{
                    //             "toggleState":"off"
                    //         }
                    //          "open-window-detect":{
                    //              "toggleState":"off"
                    //         }
                    //     }
                    // }

                    // "payload":{
                    //     "thermostat":{
                    //       "thermostat-mode":{
                    //          "thermostatMode":"MANUAL"
                    //       },
                    //       "adaptive-recovery-status":{
                    //          "adaptiveRecoveryStatus":"INACTIVE",//"HEATING"（加热中）、"INACTIVE"（未活动）
                    //       }
                    //     }
                    // }
                    const playloadValueObject = Object.values(playload);
                    const playloadleve2CapabilityName = Object.keys(playloadValueObject[0])[0];
                    const playloadLeve2capailityValue = Object.values(playloadValueObject[0])[0];
                    const deviceStateMap = trvStateNodeContext.get(deviceId);
                    node.log('before deviceStateMap ===> ' + JSON.stringify(deviceStateMap));
                    if (deviceStateMap == undefined) {
                        if (stateList.includes(playloadleve2CapabilityName) || stateList.includes('all')) {
                            node.send({ payload: data.msg.data });
                        }
                        trvStateNodeContext.set(deviceId, playload);
                        node.log('trvStateNodeContext ====> ' + JSON.stringify(trvStateNodeContext.get(deviceId)));
                    } else {
                        // including ability
                        if (stateList.includes(playloadleve2CapabilityName) || stateList.includes('all')) {
                            if (_.has(playload, 'toggle')) {
                                const capabilityValue = JSON.stringify(_.get(deviceStateMap, ['toggle', playloadleve2CapabilityName], ''));
                                // 当前toggle下的两个能力是否变化(Whether the two abilities under the current toggle have changed)
                                if (JSON.stringify(playloadLeve2capailityValue) !== capabilityValue) {
                                    node.send({ payload: data.msg.data });
                                }
                                if (!deviceStateMap.toggle) {
                                    deviceStateMap.toggle = {};
                                }
                                _.merge(deviceStateMap.toggle, playload.toggle);
                            }

                            if (_.has(playload, 'thermostat')) {
                                const capabilityValue = JSON.stringify(_.get(deviceStateMap, ['thermostat', playloadleve2CapabilityName], ''));
                                // 当前thermostat下的两个能力是否变化(Whether the two abilities under the current thermostat have changed)
                                if (JSON.stringify(playloadLeve2capailityValue) !== capabilityValue) {
                                    node.send({ payload: data.msg.data });
                                }
                                if (!deviceStateMap.thermostat) {
                                    deviceStateMap.thermostat = {};
                                }
                                _.merge(deviceStateMap.thermostat, playload.thermostat);
                            }
                            node.log('after deviceStateMap ===> ' + JSON.stringify(deviceStateMap, null, 2));
                            trvStateNodeContext.set(deviceId, deviceStateMap);
                            node.log('after trvStateNodeContext ===> ' + JSON.stringify(trvStateNodeContext.get(deviceId)));
                        }
                    }
                    return;
                }
                /** 三个目标温度，特殊处理 (Three target temperatures, special handling)*/
                if (Object.keys(playload)[0] === 'thermostat-target-setpoint') {
                    const capaValue = Object.values(playload);
                    if (stateList.includes(Object.keys(capaValue[0])[0]) || stateList.includes('all')) {
                        node.send({ payload: data.msg.data });
                        return;
                    }
                }
                // General abaility of trv;
                if (stateList.includes(Object.keys(playload).join('')) || config.state === 'all') {
                    node.send({ payload: data.msg.data });
                }
                return;
            } catch (error) {
                console.log(error);
            }
        }

        // 设备模块 (device module)
        eventBridge.on(EVENT_SSE_ON_UPDATE_DEVICE_STATE, eventSseOnAllStateDeviceHandler);
        node.on('close', (done) => {
            eventBridge.off(EVENT_SSE_ON_UPDATE_DEVICE_STATE, eventSseOnAllStateDeviceHandler);
            done();
        });

        // 安防模块 (Security module)
        function eventSseSecurityChangeHandler(jsonData) {
            try {
                node.log('jsondata' + JSON.stringify(jsonData));
                const data = JSON.parse(jsonData);
                if (config.server === data.srcNodeId) {
                    if (config.device === 'all' || (config.device === 'ihost' && config.state === 'all')) {
                        node.send({ payload: data.msg.data });
                        return;
                    }

                    const deviceData = JSON.parse(data.msg.data);
                    const playload = JSON.parse(JSON.stringify(deviceData.payload));
                    const stateList = (config.state + ',' + config.list).split(',');
                    const KeyName = Object.keys(playload)[0];

                    if (stateList.indexOf(KeyName) !== -1 || (config.state === 'all' && config.device === 'ihost')) {
                        node.send({ payload: data.msg.data });
                    }
                }
            } catch (error) {
                node.log('ihost security sse event error' + JSON.stringify(error));
            }
        }
        eventBridge.on(EVENT_SSE_SECURITY_CHANGE, eventSseSecurityChangeHandler);
        node.on('close', (done) => {
            eventBridge.off(EVENT_SSE_SECURITY_CHANGE, eventSseSecurityChangeHandler);
            done();
        });

        // 报警模块 (alarm module)
        function eventSseAlarmChangeHandler(jsonData) {
            try {
                node.log('jsondata' + JSON.stringify(jsonData));
                const data = JSON.parse(jsonData);

                if (config.server === data.srcNodeId) {
                    if (config.device === 'all' || (config.device === 'ihost' && config.state === 'all')) {
                        node.send({ payload: data.msg.data });
                        return;
                    }

                    const deviceData = JSON.parse(data.msg.data);
                    const playload = JSON.parse(JSON.stringify(deviceData.payload));
                    const stateList = (config.state + ',' + config.list).split(',');
                    const KeyName = Object.keys(playload)[0];

                    if (stateList.indexOf(KeyName) !== -1 || (config.state === 'all' && config.device === 'ihost')) {
                        node.send({ payload: data.msg.data });
                    }
                }
            } catch (error) {
                node.log('ihost alarm sse event error' + JSON.stringify(error));
            }
        }
        eventBridge.on(EVENT_SSE_ALARM_CHANGE, eventSseAlarmChangeHandler);
        node.on('close', (done) => {
            eventBridge.off(EVENT_SSE_ALARM_CHANGE, eventSseAlarmChangeHandler);
            done();
        });

        // Remove cache file.
        removeCacheFile(stateCachePath);

        // Save context to cache file.
        node.on('close', (done) => {
            writeCacheFile(stateCachePath, JSON.stringify(node.deviceStateCache));
            done();
        });
    }

    RED.nodes.registerType('event-state', GetStateNode);
};
