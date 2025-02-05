const getApiClientClass = require('./extern/libapi/index').default;
const { NodeDataCache } = require('./utils/cache');
const { eventBridge } = require('./utils/event');
const { mdns, ihostList } = require('./utils/mdns');
const gatewayInfoMap = require('./utils/gatewayInfoMap');
const { isVersionGreaterOrEqual, sleepSeconds } = require('./utils/tools');

const {
    API_URL_CACHE_ADD_API_SERVER_NODE,
    API_URL_CACHE_REMOVE_API_SERVER_NODE,
    API_URL_GET_BRIDGE_INFO,
    API_URL_GET_BRIDGE_TOKEN,
    API_URL_GET_DEVICE_LIST,
    API_URL_CONTROL_DEVICE,
    API_URL_CONTROL_CAPABILITIES_DEVICE,
    API_URL_TEST_TOKEN,
    API_URL_UPLOAD_THIRDPARTY_DEVICE_STATE,
    API_URL_UPLOAD_THIRDPARTY_DEVICE_ONLINE,
    API_URL_ADD_THIRDPARTY_DEVICE,
    EVENT_SSE_ON_UPDATE_DEVICE_STATE,
    EVENT_SSE_ON_ADD_DEVICE,
    EVENT_SSE_ON_DELETE_DEVICE,
    EVENT_SSE_ON_UPDATE_DEVICE_INFO,
    EVENT_SSE_ON_UPDATE_DEVICE_ONLINE,
    EVENT_NODE_RED_ERROR,
    API_URL_SEARCH_IP_LIST,
    API_URL_GET_SECURITY_MODE_LIST,
    EVENT_SSE_SECURITY_CHANGE,
    EVENT_SSE_ALARM_CHANGE,
    API_URL_SET_GATEWAY_MUTE,
    API_URL_CANCEL_GATEWAY_MUTE,
    API_URL_CANCEL_GATEWAY_ALARM,
    API_URL_ENABLE_SECURITY_MODE,
    API_URL_DISABLE_SECURITY_MODE,
    API_URL_ONE_CLICK_ARMING,
    API_URL_ONE_CLICK_DISARMING,
    API_URL_SET_SYSTEM_VOLUME,
    API_URL_HARDWARE_SPEAKER,
    API_URL_GET_BRIDGE,
    API_URL_QUERY_MDNS,
    V2_SUPPORT_CAPABILITIES,
} = require('./utils/const');
const axios = require('axios');
const _ = require('lodash');
const { removeCacheFile, getAllCacheFileName, getCacheFilepath } = require('./utils/fs');

/**
 * If device state is updated, then update the cache payload and return true.
 * Otherwise return false.
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

module.exports = function (RED) {
    console.log('gatewayInfoMap-----------', gatewayInfoMap);
    const nodeDataCache = new NodeDataCache();
    //Re-scan every time you enter
    nodeDataCache.clean();

    // Start mdns scan
    mdns.query({
        questions: [
            {
                name: '_ewelink._tcp.local',
                type: 'PTR',
            },
        ],
    });

    function ApiServerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        // Clean cache when user clicks deploy button.
        nodeDataCache.clean();
        node.apiClient = null;

        let configIp = _.get(config, 'ip');
        if (configIp && typeof configIp === 'string') {
            configIp = configIp.trim();
        }

        let configIpaddr = _.get(config, 'ipaddr');
        if (configIpaddr && typeof configIpaddr === 'string') {
            configIpaddr = configIpaddr.trim();
        }

        let configToken = _.get(config, 'token');
        if (configToken && typeof configToken === 'string') {
            configToken = configToken.trim();
        }

        if (!configIp && !configIpaddr) {
            RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: no IP' });
            return;
        }
        if (!configToken) {
            RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: no token' });
            return;
        }

        let gatewayIp = '';
        const ipRegex = /(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/;
        if (ipRegex.test(configIp)) {
            gatewayIp = configIp;
        } else if (configIpaddr) {
            gatewayIp = configIpaddr;
        }

        // console.log('gatewayIp ====================>',gatewayIp);
        // console.log('configIpaddr ====================>',configIpaddr);
        // console.log('configToken ====================>',configToken);

        // 先声明一个node.apiClient 防止其他服务起来时node.apiClient因为异步读取网关信息还没赋值
        // Declare a node.apiClient first to prevent node.apiClient from being assigned a value due to asynchronous reading of gateway information when other services are started.
        const ApiClient = getApiClientClass(config.id);
        // Create API client and SSE connection.
        node.apiClient = new ApiClient({
            ip: gatewayIp,
            at: configToken,
        });

        collectGatewayInfo(node, gatewayIp, configToken, config, RED);

        node.on('close', (done) => {
            // Remove all cache files
            const nodeIdList = [];
            RED.nodes.eachNode((item) => nodeIdList.push(item.id));
            const fileList = getAllCacheFileName();
            if (fileList) {
                for (const file of fileList) {
                    const i = file.indexOf('_');
                    const id = file.slice(0, i);
                    if (!nodeIdList.includes(id)) {
                        const filepath = getCacheFilepath(file);
                        removeCacheFile(filepath);
                    }
                }
            }

            node.apiClient && node.apiClient.unmountSseFunc();
            done();
        });
    }

    // Add API server node data to cache.
    // params:
    //      {
    //          "id": "xxx" - API server node ID
    //          "name": "xxx" - API server node name
    //          "ip": "xxx" - API server node IP
    //          "token": "xxx" - API server node token
    //      }
    RED.httpAdmin.post(API_URL_CACHE_ADD_API_SERVER_NODE, (req, res) => {
        const id = req.body.id;
        const name = req.body.name;
        const ip = req.body.ip;
        const token = req.body.token;

        if (nodeDataCache.has(id)) {
            nodeDataCache.remove(id);
        }
        nodeDataCache.add({
            id,
            name,
            ip,
            token,
        });

        res.send({ error: 0, msg: 'success' });
    });

    RED.httpAdmin.post(API_URL_QUERY_MDNS, (req, res) => {
        // clean();
        mdns.query({
            questions: [
                {
                    name: '_ewelink._tcp.local',
                    type: 'PTR',
                },
            ],
        });
        res.send({ error: 0, msg: 'success', data: ihostList });
    });

    // Remove API server node data from cache.
    // params:
    //      {
    //          "id": "xxx" - API server node ID
    //      }
    RED.httpAdmin.post(API_URL_CACHE_REMOVE_API_SERVER_NODE, (req, res) => {
        const id = req.body.id;

        if (nodeDataCache.has(id)) {
            nodeDataCache.remove(id);
        }

        res.send({ error: 0, msg: 'success' });
    });

    // Get bridge info.
    // params:
    //      {
    //          "ip": "xxx" - API server node IP 3596757527c9bf4f
    //      }
    RED.httpAdmin.post(API_URL_GET_BRIDGE_INFO, (req, res) => {
        const ip = req.body.ip;
        const ApiClient = getApiClientClass(req.body.id);
        const apiClient = new ApiClient({ ip });
        apiClient
            .getBridgeInfo()
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'getBridgeInfo() error' });
            });
    });

    /** get bridge name */
    RED.httpAdmin.post(API_URL_GET_BRIDGE, (req, res) => {
        const id = req.body.ip;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }
        apiClient
            .getBridgeName()
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'getBridgeName error' });
            });
    });

    // Get bridge token.
    // params:
    //      {
    //          "ip": "xxx" - API server node IP
    //      }
    RED.httpAdmin.post(API_URL_GET_BRIDGE_TOKEN, (req, res) => {
        const ip = req.body.ip;
        const ApiClient = getApiClientClass(req.body.id);
        const apiClient = new ApiClient({ ip });
        apiClient
            .getBridgeAT({ timeout: 300000 })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'getBridgeAT() error' });
            });
    });

    // Test token.
    // params:
    //      {
    //          "ip": "xxx" - API server node IP
    //          "token": "xxx" - API server node token
    //      }
    RED.httpAdmin.post(API_URL_TEST_TOKEN, (req, res) => {
        const ip = req.body.ip;
        const token = req.body.token;
        const ApiClient = getApiClientClass(req.body.id);
        const apiClient = new ApiClient({ ip, at: token });
        apiClient
            .getDeviceList()
            .then((data) => {
                if (data.error === 0) {
                    res.send({ error: 0 });
                } else {
                    res.send({ error: -1 });
                }
            })
            .catch((err) => {
                res.send({ error: -1 });
            });
    });

    // Get device list.
    // params:
    //      {
    //          "id": "xxx" - API server node ID
    //      }
    RED.httpAdmin.post(API_URL_GET_DEVICE_LIST, (req, res) => {
        const id = req.body.id;

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);

        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .getDeviceList()
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'getDeviceList() error' });
            });
    });

    // Control device.
    // params:
    //      {
    //          "id": "xxx" - API server node ID
    //          "deviceId": "xxx" - device ID
    //          "params": {} - device state params
    //      }
    RED.httpAdmin.post(API_URL_CONTROL_DEVICE, (req, res) => {
        const id = req.body.id;
        const deviceId = req.body.deviceId;
        const state = JSON.parse(req.body.state);

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }
        new ApiClient({ ip: apiClient.ip })
            .getBridgeInfo()
            .then((data) => {
                if (!data.data.ip) {
                    res.send({ error: 501, msg: 'network error' });
                    return;
                }
                apiClient
                    .updateDeviceState(deviceId, { state })
                    .then((data) => {
                        res.send(data);
                    })
                    .catch((err) => {
                        res.send({ error: 500, msg: 'updateDeviceState() error' });
                    });
            })
            .catch((err) => {
                res.send({ error: 501, msg: 'network error' });
            });
    });

    // Control device.
    // params:
    //      {
    //          "id": "xxx" - API server node ID
    //          "deviceId": "xxx" - device ID
    //          "params": {} - device capabilities params
    //      }
    RED.httpAdmin.post(API_URL_CONTROL_CAPABILITIES_DEVICE, (req, res) => {
        const id = req.body.id;
        const deviceId = req.body.deviceId;

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        const capabilities = JSON.parse(req.body.capabilities);

        // const value = Number(_.get(capabilities[0],['configuration','calibration','value']));
        // _.set(capabilities[0],['configuration','calibration','value'],Number(value));

        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }
        new ApiClient({ ip: apiClient.ip })
            .getBridgeInfo()
            .then((data) => {
                if (!data.data.ip) {
                    res.send({ error: 501, msg: 'network error' });
                    return;
                }
                node.log('actual request capabilities : ' + JSON.stringify(capabilities, null, 2));
                apiClient
                    .updateDeviceState(deviceId, { capabilities: capabilities })
                    .then((data) => {
                        res.send(data);
                    })
                    .catch((err) => {
                        res.send({ error: 500, msg: 'updateDeviceState() error' });
                    });
            })
            .catch((err) => {
                res.send({ error: 501, msg: 'network error' });
            });
    });

    // Upload thirdparty device state.
    // params:
    // {
    //     "id": "xxx" - API server node ID
    //     "deviceId": "xxx" - device ID
    //     "thirdPartyDeviceId": "xxx" - thirdparty device ID
    //     "params": {} - device state params
    // }
    RED.httpAdmin.post(API_URL_UPLOAD_THIRDPARTY_DEVICE_STATE, (req, res) => {
        const id = req.body.id;
        const deviceId = req.body.deviceId;
        const thirdPartyDeviceId = req.body.thirdPartyDeviceId;
        const params = JSON.parse(req.body.params);

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .uploadDeviceState({
                serial_number: deviceId,
                third_serial_number: thirdPartyDeviceId,
                params: { state: params },
            })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'uploadDeviceState() error' });
            });
    });

    // Upload thirdparty device online.
    // params:
    // {
    //     "id": "xxx" - API server node ID
    //     "deviceId": "xxx" - device ID
    //     "thirdPartyDeviceId": "xxx" - thirdParty device ID
    //     "params": {} - online params
    // }
    RED.httpAdmin.post(API_URL_UPLOAD_THIRDPARTY_DEVICE_ONLINE, (req, res) => {
        const id = req.body.id;
        const deviceId = req.body.deviceId;
        const thirdPartyDeviceId = req.body.thirdPartyDeviceId;
        const params = JSON.parse(req.body.params);

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .updateDeviceOnline({
                serial_number: deviceId,
                third_serial_number: thirdPartyDeviceId,
                params,
            })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'updateDeviceOnline() error' });
            });
    });

    // Add thirdparty device.
    // params:
    //       {
    //           "id": "xxx" - API server node ID
    //           "params": "xxx" - thirdparty device params
    //       }
    RED.httpAdmin.post(API_URL_ADD_THIRDPARTY_DEVICE, (req, res) => {
        const id = req.body.id;
        const params = JSON.parse(req.body.params);

        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .syncDevices({ devices: params })
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'syncDevices() error' });
            });
    });

    //Get ihost list by mdns
    RED.httpAdmin.post(API_URL_SEARCH_IP_LIST, (req, res) => {
        res.send({ error: 0, data: ihostList });
    });

    /** Get security list */
    RED.httpAdmin.post(API_URL_GET_SECURITY_MODE_LIST, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .getSecurity()
            .then((data) => {
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'getSecurity() error' });
            });
    });

    /** Gateway mute */
    RED.httpAdmin.post(API_URL_SET_GATEWAY_MUTE, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .muteBridge()
            .then((data) => {
                console.log('[api-server] muteBridge', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'muteBridge() error' });
            });
    });

    /** cancel Gateway mute */
    RED.httpAdmin.post(API_URL_CANCEL_GATEWAY_MUTE, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .unmuteBridge()
            .then((data) => {
                console.log('[api-server] unmuteBridge', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'unmuteBridge() error' });
            });
    });

    /**Cancel gateway alarm */
    RED.httpAdmin.post(API_URL_CANCEL_GATEWAY_ALARM, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .cancelAlarm()
            .then((data) => {
                console.log('cancelAlarm', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'cancelAlarm() error' });
            });
    });

    /**Enable specified security mode */
    RED.httpAdmin.post(API_URL_ENABLE_SECURITY_MODE, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        // node.log('req.body-------------------->'+JSON.stringify(req.body));
        const params = JSON.parse(JSON.stringify(req.body));
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .enableSecurityById(params.sid)
            .then((data) => {
                console.log('[api-server] enableSecurityById', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'enableSecurityById() error' });
            });
    });

    // /**One-click disarm */
    RED.httpAdmin.post(API_URL_ONE_CLICK_DISARMING, async (req, res) => {
        const id = req.body.id;
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .disableAllSecurity()
            .then((data) => {
                console.log('[api-server] disableAllSecurity', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'disableAllSecurity() error' });
            });
    });

    /** system volume */
    RED.httpAdmin.post(API_URL_SET_SYSTEM_VOLUME, async (req, res) => {
        const id = req.body.id;
        const volume = JSON.parse(req.body.volume);
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .updateBridgeConfig(volume)
            .then((data) => {
                console.log('[api-server] updateBridgeConfig', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'updateBridgeConfig() error' });
            });
    });

    /** alarm hardware speaker */
    RED.httpAdmin.post(API_URL_HARDWARE_SPEAKER, async (req, res) => {
        const id = req.body.id;
        const params = JSON.parse(JSON.stringify(req.body.params));
        const nodeData = nodeDataCache.getNodeData(id);
        const node = RED.nodes.getNode(id);
        let apiClient = null;
        const ApiClient = getApiClientClass(req.body.id);
        // If cache hit, use cache data. Otherwise use node instance.
        if (nodeData) {
            apiClient = new ApiClient({ ip: nodeData.ip, at: nodeData.token });
        } else {
            if (!node || !node.apiClient) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server: info incomplete' });
                res.send(JSON.stringify({ error: 2000, msg: 'api-server: info incomplete' }));
                return;
            }
            apiClient = node.apiClient;
        }

        apiClient
            .controlSpeaker(params)
            .then((data) => {
                console.log('[api-server] controlSpeaker', data);
                res.send(data);
            })
            .catch((err) => {
                res.send({ error: 500, msg: 'controlSpeaker() error' });
            });
    });
    RED.nodes.registerType('api-server', ApiServerNode);
};

function collectGatewayInfo(node, gatewayIp, configToken, config, RED) {
    const ApiClient = getApiClientClass(config.id);

    const apiClient = new ApiClient({
        ip: gatewayIp,
        at: configToken,
    });

    apiClient
        .getBridgeInfo()
        .then((res) => {
            if (res.error === 0 && res.data) {
                console.log('res.data.fw_version--------------', res.data);
                const isIHostApiV2 = res.data.domain === 'ihost.local' && isVersionGreaterOrEqual(res.data.fw_version, '2.1.0');
                const isCube = res.data.domain === 'cube.local';
                // api-server node id
                gatewayInfoMap.set(config.id, { ...res.data, isV2: isIHostApiV2 || isCube });

                startSse(node, gatewayIp, configToken, config, RED);
            }
        })
        .catch((err) => {
            console.log('getBridgeInfo-----error', err);
        });
}

async function startSse(node, gatewayIp, configToken, config, RED) {
    const ApiClient = getApiClientClass(config.id);
    // Create API client and SSE connection.
    node.apiClient = new ApiClient({
        ip: gatewayIp,
        at: configToken,
    });
    // 等待几秒增加sse连接的成功率（Wait a few seconds to increase the success rate of sse connection）
    await sleepSeconds(10);

    // 先取消监听事件，防止重复监听
    node.apiClient && node.apiClient.unmountSseFunc();
    node.apiClient.initSSE();
    let errHintCnt = 1;

    node.apiClient.mountSseFunc({
        onopen() {
            node.log('SSE connection success ' + gatewayIp);
        },
        onerror(err) {
            if (errHintCnt > 0) {
                // Hint only once.
                node.warn('SSE connection failed ' + gatewayIp);
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'api-server:' + err.message });
                errHintCnt--;
            }
        },
        onAddDevice(msg) {
            eventBridge.emit(EVENT_SSE_ON_ADD_DEVICE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onUpdateDeviceInfo(msg) {
            eventBridge.emit(EVENT_SSE_ON_UPDATE_DEVICE_INFO, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onDeleteDevice(msg) {
            eventBridge.emit(EVENT_SSE_ON_DELETE_DEVICE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onUpdateDeviceState(msg) {
            eventBridge.emit(EVENT_SSE_ON_UPDATE_DEVICE_STATE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onUpdateDeviceOnline(msg) {
            eventBridge.emit(EVENT_SSE_ON_UPDATE_DEVICE_ONLINE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onSecurityChange(msg) {
            eventBridge.emit(EVENT_SSE_SECURITY_CHANGE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
        onAlarmChange(msg) {
            eventBridge.emit(EVENT_SSE_ALARM_CHANGE, JSON.stringify({ srcNodeId: config.id, msg }));
        },
    });
}
