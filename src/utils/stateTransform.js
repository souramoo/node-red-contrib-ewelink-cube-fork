const _ = require('lodash');
const { convertHexToRgb } = require('../utils/tools');
const { getDeviceInfo } = require('../utils/device');
const { v2CapabilityToV1Capability } = require('../utils/capabilitiesTransform');

function v2StateDataToV1StateData(v2Data) {
    try {
        return _v2StateDataToV1StateData(v2Data);
    } catch (error) {
        console.log('v2StateDataToV1StateData-----------error', error);
        return null;
    }
}

function frontEndDataToV2StateData(frontEndData) {
    try {
        return _frontEndDataToV2StateData(frontEndData);
    } catch (error) {
        console.log('frontEndDataToV2StateData-----------error', error);
        return null;
    }
}
/** power和toggle反转和保持的处理 */
function v2StateDataToRealStateData(v2Data, deviceId, serverId) {
    try {
        return _v2StateDataToRealStateData(v2Data, deviceId, serverId);
    } catch (error) {
        console.log('v2StateDataToRealStateData-----------error', error);
    }
}

function _frontEndDataToV2StateData(frontEndData) {
    const v2StateData = {};
    const v2Capabilities = [];
    const ihost = {};
    switch (frontEndData.type) {
        case 'single':
            // {"type":"single","single":"reverse"}
            const power = { powerState: frontEndData.single };
            _.merge(v2StateData, { power });
            break;
        case 'multi':
            // {"multi":{"1":"keep","2":"off","3":"on","4":"on"},"type":"multi"}
            const multiObj = frontEndData.multi;
            for (const toggleIndex in multiObj) {
                const toggle = { [toggleIndex]: { toggleState: multiObj[toggleIndex] } };
                _.merge(v2StateData, { toggle });
            }
            break;
        case 'light':
            //{"type":"light","light":{"power":"on","brightness":"20","type":"color-temperature","colorOrTemp":"43","hslStr":""}}
            // {"type":"light","light":{"power":"on","brightness":"20","type":"color-rgb","colorOrTemp":"#4769ff","hslStr":"rgb(71, 105, 255)"}}
            for (const item in frontEndData.light) {
                if (frontEndData.light[item]) {
                    if ([item] == 'power') {
                        const power = { powerState: frontEndData.light[item] };
                        _.merge(v2StateData, { power });
                    } else if ([item] == 'brightness') {
                        const brightness = { brightness: Number(frontEndData.light[item]) };
                        _.merge(v2StateData, { brightness });
                    } else if ([item] == 'colorOrTemp') {
                        if (frontEndData.light.type === 'color-temperature') {
                            const colorTemperatureObj = {
                                colorTemperature: Number(frontEndData.light[item]),
                            };
                            _.merge(v2StateData, { 'color-temperature': colorTemperatureObj });
                        } else if (frontEndData.light.type === 'color-rgb') {
                            if (frontEndData.light.hslStr) {
                                const [red, green, blue] = frontEndData.light.hslStr.match(/\d+/g).map(Number);
                                const rgbObj = {
                                    red,
                                    green,
                                    blue,
                                };
                                _.merge(v2StateData, { 'color-rgb': rgbObj });
                            }
                        }
                    }
                }
            }
            break;
        case 'curtain':
            // {"type":"curtain","curtain":"open"}
            // {"type":"curtain","curtain":34}
            let curtain = {};
            if (typeof frontEndData.curtain === 'string') {
                curtain = {
                    'motor-control': {
                        motorControl: frontEndData.curtain,
                    },
                };
            } else {
                curtain = { percentage: { percentage: frontEndData.curtain } };
            }
            _.merge(v2StateData, curtain);
            break;
        case 'fanLight':
            //{"type":"fanLight","lightVal":"on","fanVal":"low"}
            if (frontEndData.lightVal) {
                _.merge(v2StateData, {
                    toggle: {
                        1: {
                            toggleState: frontEndData.lightVal,
                        },
                    },
                });
            }

            if (frontEndData.fanVal) {
                if (['off','keep'].includes(frontEndData.fanVal)) {
                    _.merge(v2StateData, {
                        toggle: {
                            2: {
                                toggleState: frontEndData.fanVal,
                            },
                        },
                    });
                } else {
                    _.merge(v2StateData, {
                        mode: {
                            fanLevel: {
                                modeValue: frontEndData.fanVal,
                            },
                        },
                    });
                }
            }
            break;
        case 'lightStrip':
            // {"type":"lightStrip","lightStripParams":{"power":"on","stripMode":"colorTemperature","brightness":"23","colorTemp":"34","hasModeCapabilty":true}}
            // 开关
            const powerState = frontEndData.lightStripParams.power
            const powerObj = { powerState };
            _.merge(v2StateData, { power: powerObj });
            // 当开关是开的时候才允许操作亮度色温颜色模式
            if (powerState === 'on') {
                // 亮度
                if (frontEndData.lightStripParams.brightness) {
                    const brightness = { brightness: Number(frontEndData.lightStripParams.brightness) };
                    _.merge(v2StateData, { brightness });
                }
                const lightStripMode = frontEndData.lightStripParams.stripMode;
                // 色温
                if (lightStripMode === 'colorTemperature' && frontEndData.lightStripParams.colorTemp) {
                    const colorTemperatureObj = {
                        'color-temperature': {
                            colorTemperature: Number(frontEndData.lightStripParams.colorTemp),
                        },
                    };
                    _.merge(v2StateData, colorTemperatureObj);
                }
                // 颜色
                if (lightStripMode === 'color' && frontEndData.lightStripParams.hslStr) {
                    const rgb = convertHexToRgb(frontEndData.lightStripParams.hslStr);
                    const [red, green, blue] = rgb.match(/\d+/g).map(Number);
                    const rgbObj = {
                        red,
                        green,
                        blue,
                    };
                    _.merge(v2StateData, { 'color-rgb': rgbObj });
                }
                // 模式
                const hasModeCapabilty = frontEndData.lightStripParams.hasModeCapabilty;
                if (hasModeCapabilty) {
                    _.merge(v2StateData, {
                        mode: {
                            lightMode: {
                                modeValue: lightStripMode,
                            },
                        },
                    });
                }
            }
            break;
        case 'thermostat':
            _.merge({ state: v2StateData, capabilities: v2Capabilities }, _thermostatChange(frontEndData));
            break;
        case 'ihost':
            _.merge({ ihost }, { ihost: frontEndData.ihostParams });
            break;
        default:
            break;
    }

    return {
        state: v2StateData,
        capabilities: v2Capabilities,
        ihost,
    };
}

function _thermostatChange(frontEndData) {
    const v2StateData = {};
    const v2Capabilities = [];
    if (frontEndData.thermostatParams['checkTemp']) {
        const obj = {
            capability: 'temperature',
            permission: '1010',
            settings: {
                temperatureCalibration: {
                    value: Number(frontEndData.thermostatParams['checkTemp']),
                },
            },
        };
        v2Capabilities.push(obj);
    }

    if (frontEndData.thermostatParams['isTargetOrMode'] === 'targetTemperature' && frontEndData.thermostatParams['targetTemp']) {
        // set target temperature
        const obj = {
            'thermostat-target-setpoint': {
                'manual-mode': {
                    targetSetpoint: Number(frontEndData.thermostatParams['targetTemp']),
                },
            },
        };
        _.merge(v2StateData, obj);
    } else if (
        frontEndData.thermostatParams['isTargetOrMode'] === 'thermostatMode' &&
        frontEndData.thermostatParams['thermostatMode'] &&
        frontEndData.thermostatParams['thermostatMode'] !== 'keep'
    ) {
        // set mode
        const thermostatObj = {
            thermostat: {
                'thermostat-mode': {
                    thermostatMode: frontEndData.thermostatParams['thermostatMode'],
                },
            },
        };
        _.merge(v2StateData, thermostatObj);
    }

    const frostProtectionTemp = frontEndData.thermostatParams['frostProtectionTemp'];
    if (frostProtectionTemp) {
        const obj = {
            'thermostat-target-setpoint': {
                'eco-mode': {
                    targetSetpoint: Number(frostProtectionTemp),
                },
            },
        };
        _.merge(v2StateData, obj);
    }

    const childLock = frontEndData.thermostatParams['childLock'];
    if (childLock && childLock !== 'keep') {
        const obj = {
            'child-lock': {
                powerState: childLock,
            },
        };
        _.merge(v2StateData, obj);
    }

    const openWindowsDetect = frontEndData.thermostatParams['openWindowsDetect'];
    if (openWindowsDetect && openWindowsDetect !== 'keep') {
        const obj = {
            'window-detection': {
                powerState: openWindowsDetect,
            },
        };
        _.merge(v2StateData, obj);
    }

    return {
        state: v2StateData,
        capabilities: v2Capabilities,
    };
}

// power和toggle能力的state是否存在反转或者保持的状态
function _isExistReverseOrKeep(v2Data) {
    const powerObj = _.get(v2Data.state, ['power'], {});
    const toggleObj = _.get(v2Data.state, ['toggle'], {});

    const powerAndToggleString = JSON.stringify(powerObj) + JSON.stringify(toggleObj);
    if (powerAndToggleString.indexOf('reverse') > -1 || powerAndToggleString.indexOf('keep') > -1) {
        return true;
    }
    return false;
}

function _v2StateDataToV1StateData(v2Data) {
    let v1StateData = _.cloneDeep(v2Data.state);

    const specialNewCapabilities = ['window-detection', 'child-lock', 'horizontal-swing', 'vertical-swing', 'eco', 'anti-direct-blow'];
    const newCapabilities = ['smoke', 'contact', 'motion', 'water-leak', 'lqi'];
    const newCapability2ToggleName = {
        'window-detection': 'open-window-detect',
    };
    const deviceState = v2Data.state ?? {};

    const stateKeys = Object.keys(deviceState);
    const specialToggleStates = [];
    let toggleState;
    for (const stateKey of stateKeys) {
        if (newCapabilities.includes(stateKey)) continue;
        if (stateKey === 'toggle') {
            toggleState = deviceState[stateKey];
        } else if (specialNewCapabilities.includes(stateKey)) {
            const restoreStateKey = newCapability2ToggleName[stateKey] ?? stateKey;
            specialToggleStates.push({
                [restoreStateKey]: {
                    toggleState: deviceState[stateKey].powerState,
                    updated_at: deviceState[stateKey].updated_at,
                },
            });
            delete deviceState[stateKey];
        } else if (stateKey === 'thermostat') {
            v1StateData[stateKey] = { 'thermostat-mode': { thermostatMode: deviceState[stateKey]['thermostat-mode'] } };
        } else {
            v1StateData[stateKey] = deviceState[stateKey];
        }
    }

    if (specialToggleStates.length > 0) {
        if (!toggleState) toggleState = {};
        for (const specialToggleState of specialToggleStates) {
            toggleState = Object.assign({}, toggleState, specialToggleState);
        }
    }

    if (toggleState) {
        v1StateData['toggle'] = toggleState;
    }

    const v1Capabilities = v2CapabilityToV1Capability(v2Data.capabilities);
    return {
        state: v1StateData,
        capabilities: v1Capabilities,
        ihost: v2Data.ihost,
    };
}

async function _v2StateDataToRealStateData(v2Data, deviceId, serverId) {
    // 不用处理反转和保持的state
    if (!_isExistReverseOrKeep(v2Data)) {
        return v2Data;
    }
    const deviceData = await getDeviceInfo(deviceId, serverId);
    const originState = deviceData.state;

    const { state, capabilities } = v2Data;
    for (capaKey in state) {
        if (capaKey === 'power') {
            const nowPowerState = _.get(state, ['power', 'powerState'], 'off');
            if (nowPowerState === 'reverse') {
                const originPowerState = _.get(originState, ['power', 'powerState'], 'off');
                state['power']['powerState'] = originPowerState === 'on' ? 'off' : 'on';
            }
        }

        if (capaKey === 'toggle') {
            let toggleObj = _.get(state, ['toggle']);
            const originToggleObj = _.get(originState, ['toggle'], {});
            let isAllKeepState = Object.values(toggleObj).every((item) => item.toggleState === 'keep');
            if (isAllKeepState) {
                toggleObj = 'allKeepStateError';
            } else {
                for (const toggleIndex in toggleObj) {
                    const originToggleState = _.get(originToggleObj, [toggleIndex, 'toggleState']);
                    const toggleState = _.get(toggleObj, [toggleIndex, 'toggleState']);
                    if (toggleState === 'reverse') {
                        toggleObj[toggleIndex].toggleState = originToggleState === 'on' ? 'off' : 'on';
                    }
                    if (toggleState === 'keep') {
                        toggleObj[toggleIndex].toggleState = originToggleState;
                    }
                }
            }

            state['toggle'] = toggleObj;
        }
    }

    return {
        state,
        capabilities,
    };
}

module.exports = {
    frontEndDataToV2StateData,
    v2StateDataToV1StateData,
    v2StateDataToRealStateData,
};
