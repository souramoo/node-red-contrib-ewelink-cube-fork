const axios = require('axios');
const { API_URL_GET_DEVICE_LIST ,EVENT_NODE_RED_ERROR } = require('./utils/const');

module.exports = function (RED) {
    function GetDevicesNode(config) {
        RED.nodes.createNode(this, config);

        this.on('input', async (msg) => {
            this.log('config-------------------------------->' + JSON.stringify(config));
            if(!config.server){
                RED.comms.publish(EVENT_NODE_RED_ERROR, { msg: 'get-devices: no server' });
                return;
            }
            let message = [];
            const baseUrl = 'http://127.0.0.1:1880';
            const url = baseUrl + API_URL_GET_DEVICE_LIST;
            let that = this;
            await axios
                .post(url, { id: config.server })
                .then(function (response) {
                    // Add status
                    if (response.data.error === 0) {
                        that.status({ text: '' });
                    } else if (response.data.error === 500){
                        that.status({ fill: 'red', shape: 'ring', text: RED._('get-devices.message.connect_fail') });
                    }

                    if (response.data.error === 0) {
                        let dataList = JSON.parse(JSON.stringify(response.data.data.device_list));
                        dataList=dataList.filter((item)=>(item.display_category!=='camera'));
                        let tempList = [];
                        for (const item of dataList) {
                            if (config.device && config.device !== 'all') {
                                if (item.serial_number == config.device) {
                                    tempList.push(item);
                                }
                            }

                            if (config.category && (config.device === '' || config.device === 'all')) {
                                if (item.display_category == config.category) {
                                    tempList.push(item);
                                }
                            }
                        }

                        if ((config.category === 'all' || config.category ==='') && (config.device === 'all' || config.device === '')) {
                            message = dataList;
                        } else {
                            message = tempList;
                        }
                        msg.payload = filterScheduleOfTrv(message);
                        that.send(msg);
                    }
                })
                .catch(function (error) {
                    that.error(error);
                });
        });
    }

    /** filter weeklySchedule of trv device */
    function filterScheduleOfTrv(arr){
        if(Array.isArray(arr) && arr.length > 0){
            arr = arr.map((item)=>{
                if(item.display_category === 'thermostat'){
                    item.capabilities = item.capabilities.map((i)=> {
                        // 删除 v1 和 v2的设置里的日程（Delete schedules in v1 and v2 settings）
                        if (i.capability === 'thermostat-target-setpoint' && i.name === 'auto-mode') {
                            delete i?.configuration?.weeklySchedule;
                            delete i?.settings?.weeklySchedule;
                        }
                        return i;
                    })
                }
                return item;
            })
        }
        return arr;
    }
    RED.nodes.registerType('get-devices', GetDevicesNode);
};
