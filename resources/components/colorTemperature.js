export const ColorTemperature = {
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
            <div v-if="switchValue" class="color-temperature">
                <el-slider :show-tooltip="false" v-model="colorTemperatureValue" @change="changeColorTemperature"/>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.color_temerature'),
            colorTemperatureValue: 50,
            switchValue: false,
            defaultValue: 50,
            disabled: false,
        };
    },
    watch: {
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0) {
                    this.reset();
                }
                // power联动
                const linkRalation = !this.state.power || ['reverse','off'].includes(this.state.power.powerState);
                if (this.hasPower && linkRalation) {
                    this.disabled = true;
                    this.switchValue = false;
                } else {
                    this.disabled = false;
                }
                // 色温颜色互斥
                if(this.state['color-rgb']){
                    this.switchValue = false;
                }
                // 模式联动
                const lightMode = _.get(this.state, ['mode', 'lightMode','modeValue'], '');
                if(this.hasModeLight && ['whiteLight', 'color'].includes(lightMode)){
                    this.switchValue = false;
                    this.disabled = true;
                }
            },
            immediate: true,
            deep: true,
        },
    },
    computed:{
        hasPower(){
            if(!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'power');
        },
        hasModeLight(){
            if(!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'mode' && item.name === 'lightMode');
        }
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                'color-temperature': {
                    colorTemperature: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.colorTemperatureValue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
            if(value)this.$emit('call-back', { 'color-rgb': {}}, true);
        },
        changeColorTemperature(value) {
            this.callBack(value, false);
        },
        reset() {
            this.switchValue = false;
            this.colorTemperatureValue = this.defaultValue;
        },
    },
    mounted() {
        if (!this.state.power && this.hasPower) {
            this.switchValue = false;
            this.disabled = true;
            return;
        }
        if (this.state['color-temperature']) {
            this.switchValue = true;
            this.colorTemperatureValue = this.state['color-temperature'].colorTemperature;
        }
    },
};
