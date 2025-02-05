const axios = require('axios'); // node
const {
    API_URL_GET_DEVICE_LIST,
} = require('./const');

async function getDeviceInfo(deviceId, serverId) {
    let deviceData = null;
    try {
        const res = await axios.post(`http://127.0.0.1:1880${API_URL_GET_DEVICE_LIST}`, { id: serverId });
        if (res.data.error === 0) {
            let deviceList = JSON.parse(JSON.stringify(res.data.data.device_list));
            deviceData = deviceList.find((item) => item.serial_number === deviceId);
        }
    } catch (error) {
        console.log('Get device info error : ', error);
        return deviceData;
    }
    return deviceData;
}

module.exports = {
    getDeviceInfo
};