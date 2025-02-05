export const Power = {
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
            <el-select v-model="powervalue" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.power'),
            options: [
                {
                    value: 'on',
                    label: this.nodeRed._('control-device.SelectOption.on'),
                },
                {
                    value: 'off',
                    label: this.nodeRed._('control-device.SelectOption.off'),
                },
                {
                    label: this.nodeRed._('control-device.SelectOption.reverse'),
                    value: 'reverse',
                },
            ],
            powervalue: '',
            switchValue: false,
            defaultValue: 'on',
        };
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }

                if(this.state['toggle']){
                    this.switchValue = false;
                }
            },
            immediate: true,
            deep: true,
        },
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                power: {
                    powerState: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            // The ability to clear irragation while turning off power
            if (!value) {
                this.callBack(this.defaultValue, true);
                this.clearLinkCapability();
            }else{
                this.powervalue = this.defaultValue;
                this.callBack(this.powervalue, false);
                if(value)this.$emit('call-back', { 'toggle': {}}, true);
            }
        },
        changeSelect(value) {
            this.callBack(value, false);
            if(['reverse','off'].includes(value)){
                this.clearLinkCapability();
            }
        },
        reset(){
            this.switchValue = false;
            this.powervalue = this.defaultValue;
        },
        clearLinkCapability(){
            this.$emit('call-back', { brightness: {} }, true);
            this.$emit('call-back', { 'color-rgb': {} }, true);
            this.$emit('call-back', { 'color-temperature': {}}, true);
            this.$emit('call-back', { mode: { lightMode: {} }}, true);
        }
    },
    mounted() {
        if (this.state.power) {
            this.switchValue = true;
            this.powervalue = this.state.power.powerState;
        }
    },
};
