const axios = require('axios');
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
const {
    API_URL_CONTROL_DEVICE,
    API_URL_CONTROL_CAPABILITIES_DEVICE,
    EVENT_NODE_RED_ERROR,
    API_URL_ENABLE_SECURITY_MODE,
    API_URL_ONE_CLICK_DISARMING,
    API_URL_SET_GATEWAY_MUTE,
    API_URL_CANCEL_GATEWAY_MUTE,
    API_URL_SET_SYSTEM_VOLUME,
    API_URL_HARDWARE_SPEAKER,
    API_URL_CANCEL_GATEWAY_ALARM,
} = require('./utils/const');
const _ = require('lodash');
const { frontEndDataToV2StateData, v2StateDataToV1StateData, v2StateDataToRealStateData } = require('./utils/stateTransform');
const gatewayInfoMap = require('./utils/gatewayInfoMap');
const { sleepMillisecond } = require('./utils/tools');

module.exports = function (RED) {
    function ControlDevicesNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', async () => {
            try {
                const server = config.server.trim();
                const device = config.device;

                if (!server) {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'control-device: no server' });
                    return;
                }

                if (!device) {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'control-device: no device' });
                    return;
                }

                node.log(`node config: ${JSON.stringify(config)}`);

                const params = JSON.parse(JSON.stringify(config));

                console.log('config--------------------', config);

                const versionStateData = await generateState(params, config.server);

                console.log('generateState--------------', JSON.stringify(versionStateData, null, 2));
                //  缺数据
                if ((params.list === 'null' || params.list === '') && !params.v2Data) {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: `control-device: ${RED._('control-device.message.node_execution_failed')}` });
                    return;
                }
                if (_.isEmpty(versionStateData.state) && _.isEmpty(versionStateData.capabilities) && _.isEmpty(versionStateData.ihost)) {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: `control-device: ${RED._('control-device.message.node_execution_failed')}` });
                    return;
                }

                let data = {
                    id: config.server,
                    deviceId: config.device,
                    state: {},
                    capabilities: [],
                };
                data.state = versionStateData.state;
                data.capabilities = versionStateData.capabilities;

                node.log('DEVICE CONTROL DATA : ' + JSON.stringify(data));

                if (!_.isEmpty(versionStateData.state)) {
                    singleSendState(data, node);
                }
                if (!_.isEmpty(versionStateData.capabilities)) {
                    singleSendCapability(data, node);
                }

                if (!_.isEmpty(versionStateData.ihost)) {
                    const errorFlag = controlIhost(versionStateData.ihost, config.server, node);
                    if (!errorFlag) {
                        RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: `control-device: ${RED._('control-device.message.node_execution_failed')}` });
                    }
                }
            } catch (error) {
                node.log(`control node error => ${error}`);
            }
        });
    }

    async function generateState(params, serverId) {
        const stateVersion = params.v2Data ? 2 : 1;
        const ihostVersion = gatewayInfoMap.get(serverId)?.isV2 ? 2 : 1;
        let versionStateData = { state: null, capabilities: null, ihost: null };

        console.log('stateVersion-----', stateVersion, 'ihostVersion-----', ihostVersion);

        if (stateVersion === 1 && ihostVersion === 1) {
            versionStateData = frontEndDataToV2StateData(JSON.parse(params.list));
            versionStateData = v2StateDataToV1StateData(versionStateData);
        }
        if (stateVersion === 1 && ihostVersion === 2) {
            versionStateData = frontEndDataToV2StateData(JSON.parse(params.list));
        }

        if (stateVersion === 2 && ihostVersion === 1) {
            versionStateData = v2StateDataToV1StateData(JSON.parse(params.v2Data));
        }

        if (stateVersion === 2 && ihostVersion === 2) {
            versionStateData = JSON.parse(params.v2Data);
        }

        versionStateData = await v2StateDataToRealStateData(versionStateData, params.device, serverId);
        return versionStateData;
    }

    // 逐次发送 state（Send one after another）
    async function singleSendState(data, node) {
        for (const key in data.state) {
            const sendData = _.pick(data, ['id', 'deviceId', 'state']);
            sendData.state = JSON.stringify(_.pick(data.state, key));
            if (key === 'toggle') {
                if (data.state[key] === 'allKeepStateError') {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: `control-device: ${RED._('control-device.message.node_execution_failed')}` });
                    continue;
                }
            }
            // 防止并发设备响应不了（Prevent concurrent devices from failing to respond）
            await sleepMillisecond(50);
            commonAxiosRequest(sendData, API_URL_CONTROL_DEVICE, node);
        }
    }

    // 逐次发送 capability（Send one after another）
    async function singleSendCapability(data, node) {
        for (const capability of data.capabilities) {
            const sendData = _.pick(data, ['id', 'deviceId', 'capabilities']);
            sendData.capabilities = JSON.stringify([capability]);
            await sleepMillisecond(50);
            commonAxiosRequest(sendData, API_URL_CONTROL_CAPABILITIES_DEVICE, node);
        }
    }

    /** check ihost params data */
    function controlIhost(ihostParams, id, myNode) {
        // {"type":"ihost","deviceId":"ihost","ihostParams":{"ModeType":"alarmBell","securityMode":"",
        // "systemVolume":"","systemVolumeValue":"","alarmSound":"alert3","alarmVolume":"56",
        // "armedTime":"customize","minute":"15","second":"18"}}

        let checkFlag = true;
        const ihostData = JSON.parse(JSON.stringify(ihostParams));
        if (!ihostData.ModeType) {
            return (checkFlag = false);
        }
        /** control security mode */
        if (ihostData.ModeType === 'securityMode') {
            if (!ihostData.securityMode) {
                return (checkFlag = false);
            }
            /** assamble data */
            if (ihostData.securityMode === 'disarmed') {
                commonAxiosRequest({ id }, API_URL_ONE_CLICK_DISARMING, myNode);
            } else {
                commonAxiosRequest({ id, sid: ihostData.securityMode }, API_URL_ENABLE_SECURITY_MODE, myNode);
            }
            return checkFlag;
        }

        /** control system volume*/
        if (ihostData.ModeType === 'systemVloume') {
            if (!ihostData.systemVolume) {
                return (checkFlag = false);
            }
            /** gateway mute */
            if (ihostData.systemVolume === 'disabled') {
                commonAxiosRequest({ id }, API_URL_SET_GATEWAY_MUTE, myNode);
            }
            /** cancel gateway mute */
            if (ihostData.systemVolume === 'enable') {
                commonAxiosRequest({ id }, API_URL_CANCEL_GATEWAY_MUTE, myNode);
                /** system volume */
                if (typeof ihostData.systemVolumeValue === 'number') {
                    commonAxiosRequest({ id, volume: ihostData.systemVolumeValue }, API_URL_SET_SYSTEM_VOLUME, myNode);
                }
            }
            if (ihostData.systemVolume === 'mute') {
                commonAxiosRequest({ id }, API_URL_CANCEL_GATEWAY_ALARM, myNode);
            }
            return checkFlag;
        }

        /** control alarm bell */
        if (ihostData.ModeType === 'alarmBell') {
            if (!ihostData.alarmSound || typeof ihostData.alarmVolume !== 'number' || !ihostData.armedTime) {
                return (checkFlag = false);
            }
            let time = null;
            if (ihostData.armedTime === 'keepRinging') {
                time = -1;
            }else{
                if (ihostData.minute || ihostData.second) {
                    time = Number(ihostData.minute) * 60 + Number(ihostData.second);
                }
                if (time == 0) {
                    myNode.status({ text: 'control-device.message.alarm_cant_be_zero' });
                    return;
                }
            }

            const params = {
                type: 'play_sound',
                sound: {
                    name: ihostData.alarmSound,
                    volume: Number(ihostData.alarmVolume),
                    countdown: time,
                },
            };
            commonAxiosRequest({ id, params }, API_URL_HARDWARE_SPEAKER, myNode);
            return checkFlag;
        }
        return checkFlag;
    }

    function commonAxiosRequest(params, url, myNode) {
        myNode.log('commonAxiosRequest data :' + JSON.stringify(params));
        axios
            .post(`http://127.0.0.1:1880${url}`, params)
            .then((res) => {
                // Add status
                if (res.data.error === 501) {
                    myNode.status({ fill: 'red', shape: 'ring', text: 'control-device.message.connect_fail' });
                    return;
                }
                if (res.data.error === 0) {
                    myNode.status({ text: '' });
                } else {
                    RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: `control-device: ${RED._('control-device.message.node_execution_failed')}` });
                }
                myNode.log('control device response ===> ' + JSON.stringify(res.data));
                let capabilityObj = {};

                if (!_.isEmpty(params.state)) {
                    const state = JSON.parse(params.state);
                    capabilityObj = { capability: Object.keys(state)[0] };
                }
                if (!_.isEmpty(params.capabilities)) {
                    const capabilities = JSON.parse(params.capabilities);
                    capabilityObj = { capability: capabilities[0].capability };
                }

                myNode.send({ payload: _.merge(capabilityObj, res.data) });
            })
            .catch((error) => {
                myNode.error(error);
            });
    }

    RED.nodes.registerType('control-device', ControlDevicesNode);
};
