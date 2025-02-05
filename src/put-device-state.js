const {EVENT_NODE_RED_ERROR,API_URL_UPLOAD_THIRDPARTY_DEVICE_STATE} = require('./utils/const');
const axios = require('axios');
const _ = require('lodash');
module.exports = function (RED) {
    function PutDeviceStateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', (msg) => {
            const server = config.server.trim();
            const device = config.device.trim();
            let state;

            if (!server) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'put-state-device: no server' });
                return;
            }

            if (!device) {
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'put-state-device: no device' });
                return;
            }

            if (_.has(config, 'state') && config.state) {
                state = config.state;
            } else {
                const isMsgHasPayload = _.has(msg, 'payload');
                const isPayloadObject = typeof msg.payload === 'object';
                const isPayloadEmpty = _.isEmpty(msg.payload);
                if (!isMsgHasPayload || !isPayloadObject || isPayloadEmpty) {
                    node.status({ fill: 'red', shape: 'ring', text: 'put-device-state.message.node_execution_failed' });
                    return;
                }
                state = JSON.stringify(msg.payload);
            }

            let params = {
                id: config.server,
                deviceId: config.device,
                thirdPartyDeviceId:config.number,   // thirdparty device ID
                params: state
            };
            axios.post(`http://127.0.0.1:1880${API_URL_UPLOAD_THIRDPARTY_DEVICE_STATE}`, params)
            .then((res) => {
                const errNum = _.get(res, 'data.error');
                if (typeof errNum === 'number' && errNum !== 0) {
                    node.status({ fill: 'red', shape: 'ring', text: RED._('put-device-state.message.connect_fail') });
                } else {
                    node.status({ text: '' });
                }
                node.send({ payload: res.data });
            })
            .catch((error) => {
                node.error(error);
            });
        });
    }

    RED.nodes.registerType('put-device-state', PutDeviceStateNode);
};
