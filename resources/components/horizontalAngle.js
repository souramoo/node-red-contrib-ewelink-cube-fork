export const HorizontalAngle = {
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
            <el-select :disabled="false" v-model="horizontalAngleVal" class="power-select" v-if="switchValue" @change="changeSelect">
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
            title: this.nodeRed._('control-device.label.horizontalAngle'),
            options: [
                {
                    value: '30',
                    label: '30°',
                },
                {
                    value: '60',
                    label: '60°',
                },
                {
                    value: '90',
                    label: '90°',
                },
                {
                    value: '120',
                    label: '120°',
                },
                {
                    value: '180',
                    label: '180°',
                },
                {
                    value: '360',
                    label: '360°',
                },
            ],
            horizontalAngleVal: '',
            switchValue: false,
            defaultValue:'30'
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
                    horizontalAngle: {
                        modeValue: state
                    },
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.horizontalAngleVal = this.defaultValue;
            this.callBack(this.defaultValue, !value);
        },
        changeSelect(value) {
            this.callBack(value, false);
        },
        reset(){
            this.switchValue = false;
            this.horizontalAngleVal = this.defaultValue;
        }
    },
    mounted() {
        if (this.state.mode && this.state.mode.horizontalAngle) {
            this.switchValue = true;
            this.horizontalAngleVal = this.state.mode.horizontalAngle.modeValue;
        }
    },
};
