export const FrostProtection = {
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
                v-if="switchValue"
                class="power-select"
                v-model="FrostProtection"
                @change="changeSetPoint"
                :min="minValue"
                :max="maxValue"
                :step="step"
                :placeholder="placeholderWord"
            />
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData', 'bridgeVersion'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.eco_temp'),
            switchValue: false,
            FrostProtection: undefined,
            minValue:4,
            maxValue:35,
            step:0.5,
            defaultValue:undefined
        };
    },
    computed:{
        placeholderWord(){
            const tempValue = this.nodeRed._('control-device.label.temp_value');
            return `${tempValue}(${this.minValue} - ${this.maxValue} , ${this.step})`;
        }
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }
            },
            immediate: true,
            deep: true,
        },
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                'thermostat-target-setpoint': {
                    'eco-mode': {
                        targetSetpoint: Number(state)
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.FrostProtection = this.defaultValue;
            this.computeStep();
            if(!value)this.callBack(this.defaultValue, !value);
        },
        changeSetPoint(e) {
            if(e < this.minValue || e > this.maxValue || e % this.step !== 0){
                this.FrostProtection = this.defaultValue;
                this.callBack(this.FrostProtection, true);
                RED.notify(`control-device: ${this.nodeRed._('control-device.message.correct_range_value')}`, { type: 'error' });
                return;
            }
            this.callBack(this.FrostProtection, false);
        },
        computeStep(){
            const curModeItem = this.deviceData.capabilities.find((it) =>
                it.capability === 'thermostat-target-setpoint' && it.name === 'eco-mode'
            );
            if (curModeItem && curModeItem.settings){
                this.minValue = curModeItem.settings.temperatureRange.min;
                this.maxValue = curModeItem.settings.temperatureRange.max;
                this.step = curModeItem.settings.temperatureRange.step;
            }
            if (curModeItem && curModeItem.configuration){
                this.minValue = curModeItem.configuration.temperature.min;
                this.maxValue = curModeItem.configuration.temperature.max;
                this.step = curModeItem.configuration.temperature.increment;
            }
        },
        reset(){
            this.switchValue = false;
            this.FrostProtection = this.defaultValue;
        }
    },
    mounted() {
        if (this.state['thermostat-target-setpoint']) {
            const thermostatTargetSetpoint = this.state['thermostat-target-setpoint'];
            if(thermostatTargetSetpoint['eco-mode']){
                this.switchValue = true;
                this.FrostProtection = thermostatTargetSetpoint['eco-mode'].targetSetpoint;
                this.computeStep();
            }
        }
    },
};
