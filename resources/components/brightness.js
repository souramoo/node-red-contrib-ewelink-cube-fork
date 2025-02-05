export const Brightness = {
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
            <div v-if="switchValue" class="brightness-wrap">
                <el-slider v-model="brightnessValue" :min="1" @change="changeBrightness"/>
                <span class="brightness-value">{{brightnessValue}}%</span>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.brightness'),
            brightnessValue: 50,
            switchValue: false,
            defaultValue: 50,
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
    computed:{
        hasPower(){
            if(!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'power');
        }
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                brightness: {
                    brightness: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.brightnessValue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
        },
        changeBrightness(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.brightnessValue = this.defaultValue;
        }
    },
    mounted() {
        if (!this.state.power && this.hasPower) {
            this.switchValue = false;
            this.disabled = true;
            return;
        }
        // 节点已经保存了数据
        if (this.state.brightness) {
            this.switchValue = true;
            this.brightnessValue = this.state.brightness.brightness;
        }
    },
};
