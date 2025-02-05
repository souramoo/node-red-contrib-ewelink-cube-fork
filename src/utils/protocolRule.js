const toggleNames = ["open-window-detect", "child-lock", "horizontal-swing", "vertical-swing", "eco", "anti-direct-blow"];
const toggleCapabilities = ["window-detection"];

const oldToggleNameMap = {
    "open-window-detect": "window-detection"
};

const newCapabilityMap = {
    "window-detection": "open-window-detect"
};

const settingsPermissionKeys = {
    placeholder: "00",
    read: "01",
    configure: "10",
    readAndConfigure: "11",
};
const settingsTypeKeys = {
    enum: "enum",
    numeric: "numeric",
    object: "object",
    boolean: "boolean",
};

const newPermissionKeys = {
    placeholder: "0000",
    update: "1000",
    updated: "0100",
    configure: "0010",
    query: "0001",
};

const oldPermissionKeys = {
    write: 'write',
    readWrite: 'readWrite',
    read: 'read'
};
const permissionPerset = {
    write: '1000',
    readWrite: '1100',
    read: '0100'
};


const getConfigurePermission = (settings) => {
    let configurePermission = settingsPermissionKeys.placeholder;

    if (typeof settings !== "object") return newPermissionKeys.placeholder;
    for (const setting of Object.values(settings)) {
        if (!setting.permission) continue;
        configurePermission = (parseInt(configurePermission, 2) | parseInt(setting.permission, 2)).toString(2);
    }

    return [settingsPermissionKeys.configure, settingsPermissionKeys.readAndConfigure].includes(configurePermission)
        ? newPermissionKeys.configure
        : newPermissionKeys.placeholder;
};

const getFinalConfigurePermission = ({
    permission = newPermissionKeys.placeholder,
    queryPermission = newPermissionKeys.placeholder,
    configurePermission = newPermissionKeys.placeholder
} = {}) => {
    const finalConfigurePermission = parseInt(permission, 2) | parseInt(queryPermission, 2) | parseInt(configurePermission, 2);
    return finalConfigurePermission.toString(2).padStart(4, "0");
};

const commonConvert = (capabilityInfo = {}, { newPermission } = {}) => {
    const { capability, name, permission } = capabilityInfo;
    newPermission = typeof newPermission === 'string' ? newPermission : permissionPerset[permission];
    if (typeof name === 'string' && toggleNames.includes(name)) {
        return {
            capability: oldToggleNameMap[name] ?? name,
            permission: newPermission,
        };
    }

    return {
        capability,
        permission: newPermission,
        name
    };
};


const commonRestore = (capabilityInfo = {}) => {
    const { capability, name, permission } = capabilityInfo;
    let oldPermission;
    const permissionArr = permission.split("");
    const isWrite = permissionArr.splice(0, 1).includes("1");
    const isRead = permissionArr.includes("1");
    if (isWrite && isRead) {
        oldPermission = oldPermissionKeys.readWrite;
    } else if (isWrite) {
        oldPermission = oldPermissionKeys.write;
    } else if (isRead) {
        oldPermission = oldPermissionKeys.read;
    } else {
        oldPermission = oldPermissionKeys.read;
    }

    if (toggleNames.includes(capability) || toggleCapabilities.includes(capability)) {
        return {
            capability: 'toggle',
            permission: oldPermission,
            name: newCapabilityMap[capability] ?? capability
        };
    }

    return {
        capability,
        permission: oldPermission,
        name
    };
};


module.exports = {
    power: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    toggle: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },

    'toggle-inching': {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.placeholder });
            if (configuration?.hasOwnProperty("supported")) {
                capability.settings = {
                    toggleInchingSetting: {
                        permission: settingsPermissionKeys.readAndConfigure,
                        type: settingsTypeKeys.object,
                        value: {
                            supported: configuration.supported
                        }
                    }
                };
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission
            });
            return capability;
        },
        restore: (capabilityInfo) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings?.toggleInchingSetting?.value?.hasOwnProperty("supported")) {
                capability.configuration = {
                    supported: settings.toggleInchingSetting.value.supported
                };
            }
            return capability;
        }
    },

    brightness: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    'color-temperature': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    'color-rgb': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    percentage: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                capability.settings = {
                    percentageRange: {
                        permission: settingsPermissionKeys.read,
                        type: settingsTypeKeys.numeric,
                    }
                };
                if (configuration?.hasOwnProperty("range")) {
                    capability.settings.percentageRange.min = configuration.range.min;
                    capability.settings.percentageRange.max = configuration.range.max;
                }

                if (configuration?.hasOwnProperty("increment")) {
                    capability.settings.percentageRange.step = configuration.increment;
                }
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission
            });
            return capability;
        },
        restore: (capabilityInfo) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings?.hasOwnProperty("percentageRange")) {
                const configuration = {};
                if (settings.percentageRange?.hasOwnProperty("min")
                    && settings.percentageRange?.hasOwnProperty("max")) {
                    configuration.range = {
                        min: settings.percentageRange.min,
                        max: settings.percentageRange.max
                    };
                }
                if (settings.percentageRange?.hasOwnProperty("step")) {
                    configuration.increment = settings.percentageRange.step;
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },

    "motor-control": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },
    "motor-reverse": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    "motor-clb": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    startup: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    identify: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo) => {
            return commonRestore(capabilityInfo);
        }
    },

    "power-consumption": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);

            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("resolution")) {
                    settings.resolution = {
                        permission: settingsPermissionKeys.read,
                        type: settingsTypeKeys.numeric,
                        value: configuration.resolution
                    };
                }
                if (configuration.hasOwnProperty("timeZoneOffset")) {
                    settings.timeZoneOffset = {
                        permission: settingsPermissionKeys.read,
                        type: settingsTypeKeys.numeric,
                        min: -12,
                        max: 14,
                        value: configuration.timeZoneOffset
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
                queryPermission: newPermissionKeys.query
            });
            return capability;
        },
        restore: (capabilityInfo) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("resolution")) {
                    configuration.resolution = settings.resolution.value;
                }
                if (settings.hasOwnProperty("timeZoneOffset")) {
                    configuration.timeZoneOffset = settings.timeZoneOffset.value;
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },

    "thermostat-mode-detect": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.updated });
            if (configuration) {
                const settings = {};
                if (configuration?.hasOwnProperty("supported")) {
                    settings.setpointRange = {
                        permission: settingsPermissionKeys.readAndConfigure,
                        type: settingsTypeKeys.object,
                        value: {
                            supported: configuration.supported
                        }
                    };
                }
                if (configuration?.hasOwnProperty("supportedModes")) {
                    settings.supportedModes = {
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.read,
                        values: configuration.supportedModes
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings?.hasOwnProperty("setpointRange")) {
                    configuration.supported = settings.setpointRange.value?.supported;
                }

                if (settings?.hasOwnProperty("supportedModes")) {
                    configuration.supportedModes = settings.supportedModes.values;
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },

    thermostat: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration?.hasOwnProperty("supportedModes")) {
                capability.settings = {
                    supportedModes: {
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.read,
                        values: configuration.supportedModes
                    }
                };
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings?.hasOwnProperty("supportedModes")) {
                capability.configuration = {
                    supportedModes: settings.supportedModes.values
                };
            }
            return capability;
        }
    },
    "thermostat-target-setpoint": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);

            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("temperature")) {
                    settings.temperatureUnit = {
                        type: settingsTypeKeys.enum,
                        //v2.0.0版本之前的temperatureUnit配置项不可更改
                        permission: settingsPermissionKeys.read,
                        value: configuration.temperature.scale,
                        values: [
                            "c",
                            "f"
                        ]
                    };
                    settings.temperatureRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.temperature.min,
                        max: configuration.temperature.max,
                        step: configuration.temperature.increment
                    };
                }

                if (configuration.hasOwnProperty("weeklySchedule")) {
                    settings.weeklySchedule = {
                        type: settingsTypeKeys.object,
                        permission: settingsPermissionKeys.readAndConfigure,
                        value: configuration.weeklySchedule
                    };
                }

                capability.settings = settings;
            }

            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { name, settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);

            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("temperatureUnit") && settings.hasOwnProperty("temperatureRange")) {
                    configuration.temperature = {
                        min: settings.temperatureRange.min,
                        max: settings.temperatureRange.max,
                        increment: settings.temperatureRange.step,
                        scale: settings.temperatureUnit.value
                    };
                }

                if (settings.hasOwnProperty("weeklySchedule")) {
                    configuration.weeklySchedule = settings.weeklySchedule.value;
                }
                if (name === "manual-mode") {
                    configuration.mappingMode = "MANUAL";
                } else if (name === "auto-mode") {
                    configuration.mappingMode = "AUTO";
                } else if (name === "eco-mode") {
                    configuration.mappingMode = "ECO";
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },
    detect: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("detectInterval")) {
                    settings.detectInterval = {
                        permission: settingsPermissionKeys.readAndConfigure,
                        type: settingsTypeKeys.numeric,
                        value: configuration.detectInterval,
                    };
                }
                if (configuration.hasOwnProperty("detectSensitivity")) {
                    settings.detectSensitivity = {
                        permission: settingsPermissionKeys.readAndConfigure,
                        type: settingsTypeKeys.numeric,
                        value: configuration.detectSensitivity,
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("detectInterval")) {
                    configuration.detectInterval = settings.detectInterval.value;
                }
                if (settings.hasOwnProperty("detectSensitivity")) {
                    configuration.detectSensitivity = settings.detectSensitivity.value;
                }
                capability.configuration = configuration;
            }

            return capability;
        }
    },
    temperature: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.updated });
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.temperatureRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }

                if (configuration.hasOwnProperty("scale")) {
                    settings.temperatureUnit = {
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.readAndConfigure,
                        value: configuration.scale,
                        values: [
                            "c",
                            "f"
                        ]
                    };
                }

                if (configuration.hasOwnProperty("calibration")) {
                    settings.temperatureCalibration = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.readAndConfigure,
                        min: configuration.calibration.min, // 最小值
                        max: configuration.calibration.max, // 最大值
                        step: configuration.calibration.increment, // 温度调节步长，单位同temperatureUnit
                        value: configuration.calibration.value, // 表示当前温度校准值，number类型，单位同temperatureUnit，必选。
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("temperatureRange")) {
                    configuration.range = {
                        min: settings.temperatureRange.min,
                        max: settings.temperatureRange.max,
                    };
                }

                if (settings.hasOwnProperty("temperatureUnit")) {
                    configuration.scale = settings.temperatureUnit.value;
                }

                if (settings.hasOwnProperty("temperatureCalibration")) {
                    configuration.calibration = {
                        min: settings.temperatureCalibration.min,
                        max: settings.temperatureCalibration.max,
                        increment: settings.temperatureCalibration.step,
                        value: settings.temperatureCalibration.value,
                    };
                }

                capability.configuration = configuration;
            }
            return capability;
        }
    },
    humidity: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration?.hasOwnProperty("range")) {
                if (configuration.hasOwnProperty("range")) {
                    capability.settings = {
                        humidityRange: {
                            type: settingsTypeKeys.numeric,
                            permission: settingsPermissionKeys.read,
                            min: configuration.range.min,
                            max: configuration.range.max,
                        }
                    };
                }
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings?.hasOwnProperty("humidityRange")) {
                capability.configuration = {
                    range: {
                        min: settings.humidityRange.min,
                        max: settings.humidityRange.max,
                    }
                };
            }
            return capability;
        }
    },
    battery: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    press: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration?.hasOwnProperty("actions")) {
                capability.settings = {
                    actions: { // 按键动作，可选。
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.read,
                        values: configuration.actions
                    }
                };
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings?.hasOwnProperty("actions")) {
                capability.configuration = {
                    actions: settings.actions.values
                };
            }
            return capability;
        }
    },
    "multi-press": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    rssi: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'tamper-alert': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'illumination-level': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'voltage': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'electric-current': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'electric-power': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'fault': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'threshold-breaker': {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.placeholder });

            if (configuration && configuration.hasOwnProperty("supported")) {
                capability.settings = {
                    supportedSetting: {
                        permission: settingsPermissionKeys.readAndConfigure,
                        type: settingsTypeKeys.object,
                        value: {
                            supported: configuration?.supported
                        }
                    }
                };
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;
            capability.configuration = {
                supported: settings?.supportedSetting?.value?.supported,
            };
            return capability;
        }
    },
    'inching': {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.placeholder });
            capability.settings = {
                inchingEnable: {
                    permission: settingsPermissionKeys.readAndConfigure,
                    type: settingsTypeKeys.boolean,
                    value: configuration?.enable
                },
                inchingSwitch: {
                    permission: settingsPermissionKeys.readAndConfigure,
                    type: settingsTypeKeys.enum,
                    value: configuration?.inchingSwitch,
                    values: ["on", "off"]
                },
                inchingDelay: {
                    type: settingsTypeKeys.numeric,
                    permission: settingsPermissionKeys.readAndConfigure,
                    min: configuration?.min_delay,
                    max: configuration?.max_delay,
                    value: configuration?.delay,
                    unit: "ms"
                }
            };
            // 计算configure权限位，并合并权限
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;
            capability.configuration = {
                enable: settings?.inchingEnable?.value,
                inchingSwitch: settings?.inchingSwitch?.value,
                delay: settings?.inchingDelay?.value,
                min_delay: settings?.inchingDelay?.min,
                max_delay: settings?.inchingDelay?.max
            };
            return capability;
        }
    },
    "camera-stream": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo, { newPermission: newPermissionKeys.placeholder });
            capability.settings = {
                streamSetting: {
                    permission: settingsPermissionKeys.readAndConfigure,
                    type: settingsTypeKeys.object,
                    value: configuration
                },
            };
            // 计算configure权限位，并合并权限
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;
            capability.configuration = {
                username: settings?.streamSetting?.value?.username,
                password: settings?.streamSetting?.value?.password,
                streamUrl: settings?.streamSetting?.value?.streamUrl,
                videoCodec: settings?.streamSetting?.value?.videoCodec,
                resolution: settings?.streamSetting?.value?.resolution,
                keyFrameInterval: settings?.streamSetting?.value?.keyFrameInterval,
                audioCodec: settings?.streamSetting?.value?.audioCodec,
                samplingRate: settings?.streamSetting?.value?.samplingRate,
                dataRate: settings?.streamSetting?.value?.dataRate,
            };
            return capability;
        }
    },
    mode: {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);

            if (configuration && configuration.hasOwnProperty("supportedValues")) {
                capability.settings = {
                    supportedValues: {
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.read,
                        values: configuration?.supportedValues
                    },
                };
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission
                });
            }

            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;

            capability.configuration = {
                supportedValues: settings?.supportedValues?.values,
            };

            return capability;
        }
    },
    "co2": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);

            if (configuration && configuration.hasOwnProperty("range")) {
                capability.settings = {
                    co2Range: {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration?.range?.min,
                        max: configuration?.range?.max
                    },
                };
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission
                });
            }

            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;

            capability.configuration = {
                range: {
                    min: settings?.co2Range?.min,
                    max: settings?.co2Range?.max,
                }
            };
            return capability;
        }
    },
    "illumination": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);

            if (configuration && configuration.hasOwnProperty("range")) {
                capability.settings = {
                    illuminationRange: {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration?.range?.min,
                        max: configuration?.range?.max
                    },
                };
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission
                });
            }
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;

            capability.configuration = {
                range: {
                    min: settings?.illuminationRange?.min,
                    max: settings?.illuminationRange?.max,
                }
            };
            return capability;
        }
    },
    'smoke': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'contact': {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    'motion': {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                capability.settings = {};

                if (configuration.hasOwnProperty("motionInterval")) {
                    capability.settings.motionInterval = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.readAndConfigure,
                        value: configuration?.motionInterval
                    };
                }

                if (configuration.hasOwnProperty("motionSensitivity")) {
                    capability.settings.motionSensitivity = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.readAndConfigure,
                        value: configuration?.motionSensitivity
                    };
                }
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission
                });
            }

            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;

            capability.configuration = {
                motionInterval: settings?.motionInterval?.value,
                motionSensitivity: settings?.motionSensitivity?.value,
            };
            return capability;
        }
    },
    "water-leak": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "window-detection": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "child-lock": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "anti-direct-blow": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "horizontal-swing": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "vertical-swing": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "eco": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "toggle-startup": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "detect-hold": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                capability.settings = {};

                if (configuration.hasOwnProperty("enabled")) {
                    capability.settings.detectHoldEnable = {
                        type: settingsTypeKeys.boolean,
                        permission: settingsPermissionKeys.read,
                        value: configuration?.enabled
                    };
                }

                if (configuration.hasOwnProperty("switch")) {
                    capability.settings.detectHoldSwitch = {    // 状态检测保持动作设置
                        type: settingsTypeKeys.enum,
                        permission: settingsPermissionKeys.read,
                        value: configuration?.switch,
                        values: ["on", "off"]
                    };
                }

                if (configuration.hasOwnProperty("time")) {
                    capability.settings.detectHoldTime = { // 状态检测保持时间设置
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: 1,
                        max: 359,
                        value: configuration?.time,
                        unit: "minute"
                    };
                }
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission
                });
            }

            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (!settings) return capability;

            capability.configuration = {
                enabled: settings?.detectHoldEnable?.value,//启用、禁用超时未关能力
                switch: settings?.detectHoldSwitch?.value,//为开启，off 为闭合
                time: settings?.detectHoldTime?.value, //保持时间，[1,359]，单位：分钟，可设置范围1分钟-5小时59分
            };
            return capability;
        }
    },
    "toggle-identify": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "toggle-voltage": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "toggle-electric-current": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "toggle-electric-power": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "toggle-power-consumption": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                capability.settings = {};

                if (configuration.hasOwnProperty("resolution")) {
                    capability.settings.resolution = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        value: configuration?.resolution
                    };
                }

                if (configuration.hasOwnProperty("timeZoneOffset")) {
                    capability.settings.timeZoneOffset = {  // 状态检测保持动作设置
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: -12,
                        max: 14,
                        value: configuration?.timeZoneOffset
                    };
                }
                // 计算configure权限位，并合并权限
                const configurePermission = getConfigurePermission(capability?.settings);
                capability.permission = getFinalConfigurePermission({
                    permission: capability.permission,
                    configurePermission,
                    queryPermission: newPermissionKeys.query
                });
            }

            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo, { oldPermission: "read" });
            if (!settings) return capability;

            capability.configuration = {
                resolution: settings?.resolution?.value,//启用、禁用超时未关能力
                timeZoneOffset: settings?.timeZoneOffset?.value,//为开启，off 为闭合
            };
            return capability;
        }
    },
    lqi: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    configuration: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    system: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    moisture: {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "barometric-pressure": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.barometricPressureRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("barometricPressureRange")) {
                    configuration.range = {
                        min: settings.barometricPressureRange.min,
                        max: settings.barometricPressureRange.max,
                    };
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },
    "wind-speed": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.windSpeedRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("windSpeedRange")) {
                    configuration.range = {
                        min: settings.windSpeedRange.min,
                        max: settings.windSpeedRange.max,
                    };
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },
    "wind-direction": {
        convert: (capabilityInfo = {}) => {
            return commonConvert(capabilityInfo);
        },
        restore: (capabilityInfo = {}) => {
            return commonRestore(capabilityInfo);
        }
    },
    "rainfall": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.rainfallRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("rainfallRange")) {
                    configuration.range = {
                        min: settings.rainfallRange.min,
                        max: settings.rainfallRange.max,
                    };
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },
    "ultraviolet-index": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.ultravioletIndexRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("ultravioletIndexRange")) {
                    configuration.range = {
                        min: settings.ultravioletIndexRange.min,
                        max: settings.ultravioletIndexRange.max,
                    };
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    },
    "electrical-conductivity": {
        convert: (capabilityInfo = {}) => {
            const { configuration } = capabilityInfo;
            const capability = commonConvert(capabilityInfo);
            if (configuration) {
                const settings = {};
                if (configuration.hasOwnProperty("range")) {
                    settings.electricalConductivityRange = {
                        type: settingsTypeKeys.numeric,
                        permission: settingsPermissionKeys.read,
                        min: configuration.range.min,
                        max: configuration.range.max
                    };
                }
                capability.settings = settings;
            }
            const configurePermission = getConfigurePermission(capability?.settings);
            capability.permission = getFinalConfigurePermission({
                permission: capability.permission,
                configurePermission,
            });
            return capability;
        },
        restore: (capabilityInfo = {}) => {
            const { settings } = capabilityInfo;
            const capability = commonRestore(capabilityInfo);
            if (settings) {
                const configuration = {};
                if (settings.hasOwnProperty("electricalConductivityRange")) {
                    configuration.range = {
                        min: settings.electricalConductivityRange.min,
                        max: settings.electricalConductivityRange.max,
                    };
                }
                capability.configuration = configuration;
            }
            return capability;
        }
    }
};