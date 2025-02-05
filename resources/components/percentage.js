export const Percentage = {
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
            <div class="percentage" v-if="switchValue">
                <div class="percentage-wrap">
                    <div class="percentage-slider"><el-slider :disabled="isDeviceNotCalibrated" v-model="percentageValue" @change="changeSlider"></el-slider></div>
                    <div class="percentage-value">{{percentageValue}}%</div>
                </div>
                <div class="percentage-word">
                    <span>{{fullyOpen}}</span>
                    <span>{{fullyClose}}</span>
                </div>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.percentage'),
            fullyOpen:this.nodeRed._('control-device.label.fully_open'),
            fullyClose:this.nodeRed._('control-device.label.fully_close'),
            switchValue: false,
            defaultValue:50,
            percentageValue:50
        };
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }
                if(this.state['motor-control']){
                    this.switchValue = false;
                }
            },
            immediate: true,
            deep: true,
        },
    },
    computed:{
        isDeviceNotCalibrated(){
            if(!this.deviceData) return true;
            const isPercentageOn255 = _.get(this.deviceData, ['state', 'percentage', 'percentage'], null) === 255;
            const isNotCalibrated = _.get(this.deviceData, ['state', 'motor-clb', 'motorClb'], '') !== 'normal';
            // 7015 窗帘在未校准时，state.['motor-clb'].motorClb 校准状态值为 'normal' 且进度条状态为 255，当进度条状态为 255 时将 7015 窗帘认定为未校准的状态
            return isPercentageOn255 ? true : isNotCalibrated;
        }
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                percentage: {
                    percentage: state,
                },
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.percentageValue = this.defaultValue;
            this.callBack(this.percentageValue,!value);
            if(value)this.$emit('call-back', { 'motor-control': {} }, true);
        },
        changeSlider(value){
            this.callBack(value,false);
        },
        reset(){
            this.switchValue = false;
            this.percentageValue = this.defaultValue;
        }
    },
    mounted() {
        // 节点已经保存了数据
        if (this.state.percentage) {
            this.switchValue = true;
            this.percentageValue = this.state.percentage.percentage;
        }
    },
};
