export const Ihost = {
    template: `
        <div class="card ihost">
            <div class="card-header">
                <div>{{ componentTitle }}</div>
                <el-switch
                    v-model="switchValue"
                    inactive-color="#cccc"
                    @change="changeSwitch"
                >
                </el-switch>
            </div>
            <div v-if="switchValue">
                <div v-if="switchValue" class="item power-select">
                    <div class="name">{{selectTpye}}</div>
                    <el-select v-model="ModeType" @change="changeSelect" style="width:100%">
                        <el-option
                            v-for="item in select_type"
                            :key="item.value"
                            :label="item.name"
                            :value="item.value"
                        >
                        </el-option>
                    </el-select>
                </div>

                <div v-if="ModeType === 'securityMode'" class="item power-select">
                    <div class="name">{{selectMode}}</div>
                    <el-select v-model="securityMode" style="width:100%" @change="changeSelect">
                        <el-option
                            v-for="item in modeList"
                            :key="item.value"
                            :label="item.name"
                            :value="item.value"
                        >
                        </el-option>
                    </el-select>
                </div>

                <div v-if="ModeType === 'systemVloume'" class="power-select">
                    <div class="item">
                        <div class="name">{{selectVolume}}</div>
                        <el-select v-model="systemVolume" style="width:100%" v-if="ModeType === 'systemVloume'" @change="changeSelect">
                            <el-option
                                v-for="item in systemVloumeStatus"
                                :key="item.value"
                                :label="item.name"
                                :value="item.value"
                            >
                            </el-option>
                        </el-select>
                    </div>

                    <div class="item power-select" v-if="systemVolume === 'enable'">
                        <div class="name">{{volumeSize}}</div>
                        <el-input-number style="width:100%" @change="changeSelect" v-model="systemVolumeValue" placeholder="0-100" :min="0" :max="100" />
                    </div>

                </div>

                <div v-if="ModeType === 'alarmBell'">
                    <div class="item power-select">
                        <div class="name">{{selectBell}}</div>
                        <el-select v-model="alarmSound" style="width:100%" v-if="ModeType === 'alarmBell'" @change="changeSelect">
                            <el-option
                                v-for="item in alarmSoundList"
                                :key="item.value"
                                :label="item.name"
                                :value="item.value"
                            >
                            </el-option>
                        </el-select>
                    </div>

                    <template v-if="alarmSound">
                        <div class="item power-select">
                            <div class="name">{{selectAlarmVolume}}</div>
                            <el-input-number style="width:100%" v-model="alarmVolume" placeholder="0-100" :min="0" :max="100" @change="changeSelect"/>
                        </div>

                        <div class="flex-left power-select">
                            <div class="name">{{selectAlarmDuration}}</div>
                            <el-select v-model="armedTime" @change="changeSelect" style="width:39%">
                                <el-option
                                    v-for="item in armedTimeList"
                                    :key="item.value"
                                    :label="item.name"
                                    :value="item.value"
                                >
                                </el-option>
                            </el-select>
                            <el-time-picker
                                v-model="time"
                                :format="this.nodeRed._('control-device.label.formatSecond')"
                                value-format="mm:ss"
                                :picker-options="{
                                selectableRange: '00:00:01 - 00:29:59'}"
                                v-if="armedTime === 'customize'"
                                style="margin-left:5px;width:39%"
                                @change="changeTime"
                                popper-class="ihost-time-select"
                            >
                            </el-time-picker>
                        </div>
                    </template>
                </div>

            </div>
        </div>
    `,
    props: ['nodeRed', 'deviceData', 'ihost', 'componentTitle'],
    data() {
        return {
            selectTpye:this.nodeRed._('control-device.label.select_type'),
            selectMode:this.nodeRed._('control-device.label.select_mode'),
            selectVolume:this.nodeRed._('control-device.label.system_volume'),
            volumeSize:this.nodeRed._('control-device.label.volume_size'),
            selectBell:this.nodeRed._('control-device.label.select_bell'),
            selectAlarmVolume:this.nodeRed._('control-device.label.alarm_volume'),
            selectAlarmDuration:this.nodeRed._('control-device.label.Alarm_duration'),
            modeList: [
                {
                    name: this.nodeRed._('control-device.SelectOption.home'),
                    value: '1',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.away_home'),
                    value: '2',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.sleep'),
                    value: '3',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.disarmed'),
                    value: 'disarmed',
                },
            ],
            systemVloumeStatus: [
                {
                    name: this.nodeRed._('control-device.SelectOption.enable'),
                    value: 'enable',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.disabled'),
                    value: 'disabled',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.mute'),
                    value: 'mute',
                },
            ],
            alarmSoundList: [
                {
                    name: this.nodeRed._('control-device.SelectOption.alert1'),
                    value: 'alert1',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alert2'),
                    value: 'alert2',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alert3'),
                    value: 'alert3',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alert4'),
                    value: 'alert4',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alert5'),
                    value: 'alert5',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.doorbell1'),
                    value: 'doorbell1',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.doorbell2'),
                    value: 'doorbell2',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.doorbell3'),
                    value: 'doorbell3',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.doorbell4'),
                    value: 'doorbell4',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.doorbell5'),
                    value: 'doorbell5',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alarm1'),
                    value: 'alarm1',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alarm2'),
                    value: 'alarm2',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alarm3'),
                    value: 'alarm3',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alarm4'),
                    value: 'alarm4',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.alarm5'),
                    value: 'alarm5',
                },
            ],
            armedTimeList: [
                {
                    name: this.nodeRed._('control-device.SelectOption.keep_ringing'),
                    value: 'keepRinging',
                },
                {
                    name: this.nodeRed._('control-device.SelectOption.customize'),
                    value: 'customize',
                },
            ],
            select_type: [
                {
                    name: this.nodeRed._('control-device.label.security_mode'),
                    value: 'securityMode',
                },
                {
                    name: this.nodeRed._('control-device.label.system_volume'),
                    value: 'systemVloume',
                },
                {
                    name: this.nodeRed._('control-device.label.alarm_bell'),
                    value: 'alarmBell',
                },
            ],
            switchValue: false,

            ModeType:'',
            securityMode:'',
            systemVolume:'',
            systemVolumeValue:undefined,
            alarmSound:'',
            alarmVolume:undefined,
            armedTime:'',
            time:undefined,
            minute:'',
            second:'',
        };
    },
    methods: {
        callBack(deleteFlag) {
            const ihost = {
                ModeType: this.ModeType,
                securityMode: this.securityMode,
                systemVolume: this.systemVolume,
                systemVolumeValue: Number(this.systemVolumeValue),
                alarmSound: this.alarmSound,
                alarmVolume: this.alarmVolume,
                armedTime: this.armedTime,
                minute: this.minute,
                second: this.second
            };
            this.$emit('change-ihost', ihost, deleteFlag);
        },
        changeSwitch(value) {
            this.ModeType = 'securityMode';
            this.callBack(!value);
        },
        changeSelect() {
            this.callBack(false);
        },
        changeTime(value){
            const timeList = value.split(':');
            this.minute = Number(timeList[0]);
            this.second = Number(timeList[1]);
            console.log('minute ==>', this.minute);
            console.log('second ==>', this.second);
            this.callBack(false);
        },
        transformTime(time) {
            const current = new Date(new Date().toLocaleDateString()).getTime();
            return new Date(current + time * 1000);
        },
        init(){
            // console.log('this.ihost.ModeType',this.ihost.ModeType);
            if(this.ihost.ModeType === 'securityMode'){
                this.ModeType = 'securityMode';
                this.securityMode = this.ihost.securityMode;
                return;
            }
            if(this.ihost.ModeType === 'systemVloume'){
                this.ModeType = 'systemVloume';
                this.systemVolume = this.ihost.systemVolume;
                this.systemVolumeValue = Number(this.ihost.systemVolumeValue);
                return;
            }
            if(this.ihost.ModeType === 'alarmBell'){
                this.ModeType = 'alarmBell';
                this.alarmSound = this.ihost.alarmSound;
                this.alarmVolume = typeof this.ihost.alarmVolume === 'number' ? this.ihost.alarmVolume : undefined;
                this.armedTime = this.ihost.armedTime;
                this.minute = this.ihost.minute;
                this.second = this.ihost.second;
                const time = (Number(this.minute)*60) + Number(this.second);
                this.time = this.transformTime(time);
                return;
            }
        }
    },
    mounted() {
        if (this.ihost && Object.keys(this.ihost).length !== 0) {
            if(this.ihost.ModeType){
                this.switchValue = true;
                this.init();
            }
        }
    },
};
