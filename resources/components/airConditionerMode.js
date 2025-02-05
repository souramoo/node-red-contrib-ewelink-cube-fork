export const AirConditionerMode = {
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
            <el-select :disabled="false" v-model="airConditionModeVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.airConditionerMode'),
            options: [
                {
                    value: 'auto',
                    label: this.nodeRed._('control-device.SelectOption.mode_auto'),
                },
                {
                    value: 'cool',
                    label: this.nodeRed._('control-device.SelectOption.mode_cool'),
                },
                {
                    value: 'heat',
                    label: this.nodeRed._('control-device.SelectOption.mode_heat'),
                },
                {
                    value: 'fan',
                    label: this.nodeRed._('control-device.SelectOption.mode_fan'),
                },
                {
                    value: 'dry',
                    label: this.nodeRed._('control-device.SelectOption.mode_dry'),
                },
            ],
            airConditionModeVal: '',
            switchValue: false,
            defaultValue:'auto'
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
                    airConditionerMode: {
                        modeValue: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.airConditionModeVal = this.defaultValue;
            this.callBack(this.defaultValue,!value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.airConditionModeVal = this.defaultValue;
        }
    },
    mounted() {
        // 节点已经保存了数据
        if (this.state.mode && this.state.mode.airConditionerMode) {
            this.switchValue = true;
            this.airConditionModeVal = this.state.mode.airConditionerMode.modeValue;
        }
    },
};
