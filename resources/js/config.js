const config = {
    power: [
        {
            component: 'Power',
            priority: 2,
        },
    ],
    toggle: [
        {
            component: 'Toggle',
            priority: 3,
        },
    ],
    percentage: [
        {
            component: 'Percentage',
            priority: 7,
        },
    ],
    'motor-control': [
        {
            component: 'MotorControl',
            priority: 8,
        },
    ],
    brightness: [
        {
            component: 'Brightness',
            priority: 4,
        },
    ],
    'color-temperature': [
        {
            component: 'ColorTemperature',
            priority: 5,
        },
    ],
    'color-rgb':[
        {
            component: 'ColorRgb',
            priority: 6,
        }
    ],
    thermostat:[
        {
            component: 'Thermostat',
            priority: 11,
        }
    ],
    'thermostat-target-setpoint':[
        {
            component: 'ThermostatTargetSetpoint',
            priority: 13,
            name:'manual-mode'
        },
        {
            component: 'ThermostatTargetSetpoint',
            priority: 13,
            name:'auto-mode'
        },
        {
            component: 'ThermostatTargetSetpoint',
            priority: 13,
            name:'eco-mode'
        },
        {
            component: 'FrostProtection',
            priority: 13,
        }
    ],
    mode:[
        {
            component: 'FanMode',
            priority: 15,
            name:'fanMode'
        },
        {
            component: 'AirConditionerMode',
            priority: 15,
            name:'airConditionerMode'
        },
        {
            component: 'FanLevel',
            priority: 15,
            name:'fanLevel'
        },
        {
            component: 'ThermostatMode',
            priority: 15,
            name:'thermostatMode'
        },
        {
            component: 'HorizontalAngle',
            priority: 15,
            name:'horizontalAngle'
        },
        {
            component: 'VerticalAngle',
            priority: 15,
            name:'verticalAngle'
        },
        {
            component: 'LightMode',
            priority: 15,
            name:'lightMode'
        }
    ],
    'anti-direct-blow':[
        {
            component: 'AntiDirectBlow',
            priority: 47,
        }
    ],
    'horizontal-swing':[
        {
            component: 'HorizontalSwing',
            priority: 48,
        }
    ],
    'vertical-swing':[
        {
            component: 'VerticalSwing',
            priority: 49,
        }
    ],
    eco:[
        {
            component: 'Eco',
            priority: 50,
        }
    ],
    irrigation:[
        {
            component: 'Irrigation',
            priority: 44,
            name:'auto-controller'
        }
    ],
    'child-lock':[
        {
            component: 'ChildLock',
            priority: 99,
        }
    ],
    'window-detection':[
        {
            component: 'WindowDetection',
            priority: 99,
        }
    ],
    'temperature':[
        {
            component: 'TemperatureCalibration',
            priority: 99,
        }
    ]
};
