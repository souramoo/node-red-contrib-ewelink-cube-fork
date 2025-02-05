export const Thermostat = {
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
            <el-select :disabled="false" v-model="trvModelValue" class="power-select" v-if="switchValue" @change="changeSelect">
                <el-option
                    v-for="item in options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                >
                </el-option>
            </el-select>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.thermostat'),
            options: [
                {
                    value: 'MANUAL',
                    label: this.nodeRed._('control-device.SelectOption.manual_mode'),
                },
                {
                    value: 'AUTO',
                    label: this.nodeRed._('control-device.SelectOption.auto_mode'),
                },
                {
                    value: 'ECO',
                    label: this.nodeRed._('control-device.SelectOption.forst_protection'),
                },
            ],
            trvModelValue: '',
            switchValue: false,
            defaultValue:'MANUAL'
        };
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
                thermostat: {
                    'thermostat-mode': {
                        thermostatMode: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.trvModelValue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
            if(!value)this.$emit('call-back', { 'thermostat-target-setpoint': { 'manual-mode': {} }}, true);
        },
        changeSelect(value) {
            this.callBack(value, false);
            if(['AUTO','ECO'].includes(value)){
                this.$emit('call-back', { 'thermostat-target-setpoint': { 'manual-mode': {} }}, true);
            }
        },
        reset(){
            this.switchValue = false;
            this.trvModelValue = this.defaultValue;
        }
    },
    mounted() {
        const trvMode = _.get(this.state,['thermostat', 'thermostat-mode','thermostatMode'],'');
        if (trvMode) {
            this.switchValue = true;
            this.trvModelValue = trvMode;
        }
    },
};
