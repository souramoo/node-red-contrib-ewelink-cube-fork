export const FanMode = {
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
            <el-select :disabled="false" v-model="faModeVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
                    value: 'normal',
                    label: this.nodeRed._('control-device.SelectOption.normal'),
                },
                {
                    value: 'sleep',
                    label: this.nodeRed._('control-device.SelectOption.sleep'),
                },
                {
                    value: 'child',
                    label: this.nodeRed._('control-device.SelectOption.child'),
                },
            ],
            faModeVal: '',
            switchValue: false,
            defaultValue:'normal'
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
                    fanMode: {
                        modeValue: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.faModeVal = this.defaultValue;
            this.callBack(this.defaultValue, !value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.faModeVal = this.defaultValue;
        }
    },
    mounted() {
        // 节点已经保存了数据
        if (this.state.mode && this.state.mode.fanMode) {
            this.switchValue = true;
            this.faModeVal = this.state.mode.fanMode.modeValue;
        }
    },
};
