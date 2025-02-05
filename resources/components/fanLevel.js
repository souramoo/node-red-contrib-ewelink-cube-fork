export const FanLevel = {
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
            <el-select :disabled="false" v-model="fanLevelVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.fanMode'),
            options: [
                {
                    value: 'low',
                    label: this.nodeRed._('control-device.SelectOption.low'),
                },
                {
                    value: 'medium',
                    label: this.nodeRed._('control-device.SelectOption.medium'),
                },
                {
                    value: 'high',
                    label: this.nodeRed._('control-device.SelectOption.high'),
                },
            ],
            fanLevelVal: '',
            switchValue: false,
            defaultValue:'low'
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
                mode: {
                    fanLevel: {
                        modeValue: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.fanLevelVal = this.defaultValue;
            this.callBack(this.defaultValue,!value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.fanLevelVal = this.defaultValue;
        }
    },
    mounted() {
        // 节点已经保存了数据
        if (this.state.mode && this.state.mode.fanLevel) {
            this.switchValue = true;
            this.fanLevelVal = this.state.mode.fanLevel.modeValue;
        }
    },
};
