export const ThermostatTargetSetpoint = {
    template: `
        <div class="card">
            <div class="card-header">
                <span>{{title}}</span>
                <el-switch
                    v-model="switchValue"
                    inactive-color="#cccc"
                    @change="changeSwitch"
                    :disabled="disabled"
                >
                </el-switch>
            </div>
            <el-input-number
                v-if="switchValue"
                class="power-select"
                v-model="targetSetpointValue"
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
            title: this.nodeRed._('control-device.label.thermostat_target_setpoint'),
            switchValue: false,
            targetSetpointValue: undefined,
            minValue:4,
            maxValue:35,
            step:0.5,
            defaultValue:undefined,
            disabled:false
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

                const trvMode = _.get(this.state, ['thermostat','thermostat-mode','thermostatMode'],null);
                if(trvMode !== 'MANUAL'){
                    this.disabled = true
                    this.switchValue = false;
                }else{
                    this.disabled = false;
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
                    'manual-mode': {
                        targetSetpoint: Number(state)
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.targetSetpointValue = this.defaultValue;
            this.computeStep();
            if(!value)this.callBack(this.defaultValue, !value);
        },
        changeSetPoint(e) {
            if(e < this.minValue || e > this.maxValue || e % this.step !== 0){
                this.targetSetpointValue = this.defaultValue;
                this.callBack(this.targetSetpointValue, true);
                RED.notify(`control-device: ${this.nodeRed._('control-device.message.correct_range_value')}`, { type: 'error' });
                return;
            }
            this.callBack(this.targetSetpointValue, false);
        },
        computeStep(){
            const curModeItem = this.deviceData.capabilities.find((it) =>
                it.capability === 'thermostat-target-setpoint' && it.name === 'manual-mode'
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
            this.targetSetpointValue = this.defaultValue;
        }
    },
    mounted() {
        const trvMode = _.get(this.state, ['thermostat','thermostat-mode','thermostatMode'],null);
        if(trvMode !== 'MANUAL'){
            this.switchValue = false;
            this.disabled = true;
            return;
        }
        // 节点已经保存了数据
        if (this.state['thermostat-target-setpoint']) {
            this.switchValue = true;
            const thermostatTargetSetpoint = this.state['thermostat-target-setpoint'];
            if(thermostatTargetSetpoint['manual-mode']){
                this.targetSetpointValue = thermostatTargetSetpoint['manual-mode'].targetSetpoint;
                this.computeStep();
            }
        }
    },
};
