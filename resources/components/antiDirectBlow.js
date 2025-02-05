export const AntiDirectBlow = {
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
            <el-select v-model="antiDirectblowVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.anti_direct_blow'),
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
            antiDirectblowVal: '',
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
                'anti-direct-blow': {
                    powerState: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.antiDirectblowVal = this.defaultValue;
            this.callBack(this.defaultValue,!value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.antiDirectblowVal = this.defaultValue;
        }
    },
    mounted() {
        if (this.state['anti-direct-blow']) {
            this.switchValue = true;
            this.antiDirectblowVal = this.state['anti-direct-blow'].powerState;
        }
    },
};
