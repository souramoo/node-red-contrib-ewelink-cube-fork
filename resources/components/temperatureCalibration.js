export const TemperatureCalibration = {
    template: `
        <div class="card">
            <div class="card-header">
                <span>{{title}}</span>
                <el-switch
                    v-model="switchValue"
                    inactive-color="#cccc"
                    @change="changeSwitch"
                >
                </el-switch>
            </div>
            <el-input-number
                v-model="tempCalibrationVal"
                @change="changeValue"
                class="power-select"
                v-if="switchValue"
                :placeholder="placeholderWord"
                :min="minValue"
                :max="maxValue"
            />
        </div>
    `,
    props: ['nodeRed', 'deviceData', 'capabilities' ],
    data() {
        return {
            title: this.nodeRed._('control-device.label.temp_calibration'),
            tempCalibrationVal: undefined,
            switchValue: false,
            defaultValue: undefined,
            minValue: -7,
            maxValue: 7,
            step: 0.2,
        };
    },
    computed: {
        placeholderWord() {
            const offset = this.nodeRed._('control-device.label.offset');
            return `${offset}(${this.minValue} - ${this.maxValue} , ${this.step})`;
        },
    },
    watch: {
        capabilities: {
            handler(val) {
                if (val && Array.isArray(val) && val.length === 0) {
                    this.reset();
                }
            },
            immediate: true,
            deep: true,
        },
    },
    methods: {
        callBack(state, deleteFlag) {
            const obj = {
                capability: 'temperature',
                permission: '1010',
                settings: {
                    temperatureCalibration: {
                        value: Number(state),
                    },
                },
            };
            this.$emit('change-capability', [obj], deleteFlag);
        },
        changeSwitch(value) {
            this.tempCalibrationVal = this.defaultValue;
            if (!value) this.callBack(this.defaultValue, !value);
        },
        changeValue(value) {
            if (value < this.minValue || value > this.maxValue || (value * 10) % (this.step * 10) !== 0) {
                this.tempCalibrationVal = this.defaultValue;
                this.callBack(this.tempCalibrationVal, true);
                RED.notify(`control-device: ${this.nodeRed._('control-device.message.correct_range_value')}`, { type: 'error' });
                return;
            }
            this.callBack(value, false);
        },
        computeStep() {
            const curModeItem = this.deviceData.capabilities.find((it) => it.capability === 'temperature');

            if (curModeItem && curModeItem.settings){
                this.minValue = curModeItem.settings.temperatureCalibration.min;
                this.maxValue = curModeItem.settings.temperatureCalibration.max;
                this.step = curModeItem.settings.temperatureCalibration.step;
            }
            if (curModeItem && curModeItem.configuration){
                this.minValue = curModeItem.configuration.temperature.min;
                this.maxValue = curModeItem.configuration.temperature.max;
                this.step = curModeItem.configuration.temperature.increment;
            }
        },
        reset() {
            // this.switchValue = false;
            this.tempCalibrationVal = this.defaultValue;
        },
    },
    mounted() {
        if (this.capabilities && Array.isArray(this.capabilities) && this.capabilities.length !== 0) {
            this.switchValue = true;
            const temperature = this.capabilities.find((item) => item.capability === 'temperature');
            if (temperature && temperature.settings){
                this.tempCalibrationVal = temperature.settings.temperatureCalibration.value;
            }
        }
    },
};
