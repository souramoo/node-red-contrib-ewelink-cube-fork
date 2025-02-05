export const Irrigation = {
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
            <div style="margin:12px 0" v-if="switchValue">
                <div class="irrigation">
                    <label class="capacity">{{ this.nodeRed._('control-device.label.irrigation_capacity') }}</label>
                    <el-input-number v-model="volumeVal" class="volume" @change="changeVolume" :min="1" :max="maxVolume" />
                    <span class="irrigation-unit">L</span>
                </div>
                <div class="irrigation">
                    <label class="time">{{ this.nodeRed._('control-device.label.irrigation_duration') }}</label>
                    <el-time-picker
                        class="irrigation-time"
                        v-model="irrigationTimeVal"
                        @change="changeTime"
                        :default-value="transformTime(1200)"
                        :clearable="false"
                        :format="this.nodeRed._('control-device.label.formatTime')"
                        :picker-options="{
                            selectableRange: '00:00:01 - 23:59:59'
                        }"
                    >
                    </el-time-picker>
                </div>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.irrigation_auto_controll'),
            volumeVal: undefined,
            switchValue: false,
            defaultValue: 30,
            irrigationTimeVal: 0,
            disabled: false,
            maxVolume: 6500,
            defaultTime:1200
        };
    },
    computed:{
        hasPower(){
            if(!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'power');
        }
    },
    watch: {
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
        callBack(state, deleteFlag, type) {
            const iraData = {
                irrigation: {
                    'auto-controller': {
                        action: {
                            [type === 'time' ? 'perDuration' : 'perConsumedVolume']: state,
                            count: 1,
                            intervalDuration: 0,
                        },
                        type,
                    },
                },
            };
            this.$emit('call-back', { irrigation: {} }, true);
            this.$emit('call-back', iraData, deleteFlag);
        },
        changeSwitch(value) {
            this.volumeVal = this.defaultValue;
            this.irrigationTimeVal = undefined;
            this.callBack(this.defaultValue, !value, 'volume');
        },
        changeVolume(value) {
            this.irrigationTimeVal = undefined;
            if (!value && value !== 0) {
                this.callBack(value, true, 'volume');
                return;
            }
            this.callBack(value, false, 'volume');
        },
        changeTime(value) {
            if(value)this.volumeVal = undefined;
            const hours = new Date(value).getHours() * 3600;
            const minutes = new Date(value).getMinutes() * 60;
            const seconds = new Date(value).getSeconds();
            const transformTime = hours + minutes + seconds;
            this.callBack(transformTime, false, 'time');
        },
        initVolumeRange() {
            if (!this.deviceData) return;
            const irragation = this.deviceData.capabilities.find((item) => item.capability === 'irrigation' && item.name === 'auto-controller');
            if (!irragation) return;
            const volumeRange = _.get(irragation, ['settings', 'volumeRange']);
            this.maxVolume = volumeRange.max;
        },
        transformTime(time) {
            const current = new Date(new Date().toLocaleDateString()).getTime();
            return new Date(current + time * 1000);
        },
        reset(){
            this.switchValue = false;
            this.volumeVal = undefined;
            this.irrigationTimeVal = undefined;
        }
    },
    mounted() {
        this.initVolumeRange();

        if (this.state.irrigation && this.state.irrigation['auto-controller']) {
            this.switchValue = true;
            const autoController = _.get(this.state, ['irrigation', 'auto-controller']);
            const type = autoController.type;
            if (type === 'time') this.irrigationTimeVal = this.transformTime(autoController.action.perDuration);
            else if (type === 'volume') this.volumeVal = autoController.action.perConsumedVolume;
        }
    },
};
