export const MotorControl = {
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
            <el-select :disabled="false" v-model="motorControlvalue" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.motor_control'),
            options: [
                {
                    value: 'open',
                    label: this.nodeRed._('control-device.SelectOption.open'),
                },
                {
                    value: 'close',
                    label: this.nodeRed._('control-device.SelectOption.close'),
                },
                {
                    value: 'stop',
                    label: this.nodeRed._('control-device.SelectOption.stop'),
                },
            ],
            motorControlvalue: '',
            switchValue: false,
            defaultValue: 'open',
        };
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }

                if(this.state.percentage){
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
                'motor-control': {
                    motorControl: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.motorControlvalue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
            if(value)this.$emit('call-back', { percentage: {} }, true);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.motorControlvalue = this.defaultValue;
        }
    },
    mounted() {
        // 节点已经保存了数据
        if (this.state['motor-control']) {
            this.switchValue = true;
            this.motorControlvalue = this.state['motor-control'].motorControl;
        }
    },
};
