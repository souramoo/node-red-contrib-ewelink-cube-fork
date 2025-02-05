export const HorizontalSwing = {
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
            title: this.nodeRed._('control-device.label.horizontal_swing'),
            options: [
                {
                    value: 'on',
                    label: this.nodeRed._('control-device.SelectOption.on'),
                },
                {
                    value: 'off',
                    label: this.nodeRed._('control-device.SelectOption.off'),
                },
            ],
            powervalue: '',
            switchValue: false,
            defaultValue:'on'
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
                'horizontal-swing': {
                    powerState: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.powervalue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.powervalue = this.defaultValue;
        }
    },
    mounted() {
        if (this.state['horizontal-swing']) {
            this.switchValue = true;
            this.powervalue = this.state['horizontal-swing'].powerState;
        }
    },
};
