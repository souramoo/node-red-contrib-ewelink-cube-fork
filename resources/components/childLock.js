export const ChildLock = {
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
            <el-select v-model="childLockValue" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.child_lock'),
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
            childLockValue: '',
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
                'child-lock': {
                    powerState: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.childLockValue = this.defaultValue;
            this.callBack(this.defaultValue,!value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.childLockValue = this.defaultValue;
        }
    },
    mounted() {
        if (this.state['child-lock']) {
            this.switchValue = true;
            this.childLockValue = this.state['child-lock'].powerState;
        }
    },
};
