export const LightMode = {
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
            <el-select :disabled="false" v-model="lightModeVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.lightMode'),
            options: [
                {
                    value: 'whiteLight',
                    label: this.nodeRed._('control-device.SelectOption.whiteLight'),
                },
                {
                    value: 'colorTemperature',
                    label: this.nodeRed._('control-device.SelectOption.light_mode_color_temperature'),
                },
                {
                    value: 'color',
                    label: this.nodeRed._('control-device.SelectOption.light_mode_color'),
                },
            ],
            lightModeVal: '',
            switchValue: false,
            defaultValue:'whiteLight',
            disabled: false,
        };
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }

                const linkRalation = !this.state.power || ['reverse','off'].includes(this.state.power.powerState);
                if (this.hasPower && linkRalation) {
                    this.disabled = true;
                    this.switchValue = false;
                } else {
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
                mode: {
                    lightMode: {
                        modeValue: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.lightModeVal = this.defaultValue;
            this.callBack(this.defaultValue, !value);
            this.handleRelation();
        },
        changeSelect(value) {
            this.callBack(value, false);
            this.handleRelation();
        },
        reset(){
            this.switchValue = false;
            this.lightModeVal = this.defaultValue;
        },
        handleRelation(){
            if(this.lightModeVal === 'whiteLight'){
                this.$emit('call-back', { 'color-rgb': {} }, true);
                this.$emit('call-back', { 'color-temperature': {}}, true);
            }
            if(this.lightModeVal === 'colorTemperature'){
                this.$emit('call-back', { 'color-rgb': {} }, true);
            }
            if(this.lightModeVal === 'color'){
                this.$emit('call-back', { 'color-temperature': {}}, true);
            }
        },
    },
    computed:{
        hasPower(){
            if(!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'power');
        }
    },
    mounted() {
        if (!this.state.power && this.hasPower) {
            this.switchValue = false;
            this.disabled = true;
            return;
        }

        if (this.state.mode && this.state.mode.lightMode) {
            this.switchValue = true;
            this.lightModeVal = this.state.mode.lightMode.modeValue;
        }
    },
};
