export const Toggle = {
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
            <div style="margin-top:14px"  v-if="switchValue">
                <div class="toggle" v-for="it,index in toggleList" :key="index">
                    <div class="toggle-label">{{it.switchLabel}}</div>
                    <el-select v-model="it.switchValue" class="toggle-select" @change="changeSelect">
                        <el-option
                            v-for="item in options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        >
                        </el-option>
                    </el-select>
                </div>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.toggle'),
            options: [
                {
                    value: 'on',
                    label: this.nodeRed._('control-device.SelectOption.on'),
                },
                {
                    value: 'off',
                    label: this.nodeRed._('control-device.SelectOption.off'),
                },
                {
                    value: 'reverse',
                    label: this.nodeRed._('control-device.SelectOption.reverse'),
                },
                {
                    value: 'keep',
                    label: this.nodeRed._('control-device.SelectOption.keep'),
                }
            ],
            switchValue: false,
            toggleList: [],
        };
    },
    watch:{
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0){
                    this.reset();
                }

                if(this.state['power']){
                    this.switchValue = false;
                }
            },
            immediate: true,
            deep: true,
        },
    },
    methods: {
        callBack(data, deleteFlag) {
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.initToggle();
            this.callBack( this.getData(), !value );
            if(value)this.$emit('call-back', { 'power': {}}, true);
        },
        changeSelect() {
            const deleteFlag = Object.keys(this.getData().toggle).length === 0;
            this.callBack(this.getData(), deleteFlag );
        },
        getData() {
            const data = {
                toggle: {},
            };
            if (this.toggleList.length === 0) return data;
            for(const item of this.toggleList){
                if(item.switchValue !== ''){
                    data.toggle[item.toggleKey] = {
                        toggleState: item.switchValue
                    }
                }
            }
            return data;
        },
        initToggle() {
            const needFilterNameToggle = [
                "eco",
                "child-lock",
                "vertical-swing",
                "horizontal-swing",
                "window-detection",
                "anti-direct-blow"
            ]
            // 多通道渲染
            const capabilities = this.deviceData.capabilities;
            if (!capabilities) return;

            // console.log(Object.keys(this.state.toggle),'升级转换的数据');
            // console.log(Object.keys(this.deviceData.state.toggle),'state的数据');

            // console.log('capabilites的数据 ====>', this.deviceData.capabilities.filter((item) => item.capability === 'toggle').map((e) => e.name));

            const modifyToggleNameFlag = _.has(this.deviceData,['tags','toggle'],false);
            this.toggleList = capabilities
                .filter((item) => item.capability === 'toggle' && !needFilterNameToggle.includes(item.name))
                .map((it, idx) => {
                    return {
                        switchValue: 'on',
                        toggleKey: it.name,
                        switchLabel: modifyToggleNameFlag ? this.deviceData.tags.toggle[it.name] : `${this.nodeRed._('control-device.swtich')} ${idx + 1}`,
                    };
                });
            // console.log('this.toggleList 11111 ===>', this.toggleList);
            // console.log('state ===>', this.deviceData.state);
        },
        setSaveValue() {
            if (!this.state.toggle) return;
            const toggle = this.state.toggle;
            const toggleKeyList = Object.keys(this.state.toggle);

            if (Object.keys(this.state.toggle).length === 0) return;
            this.switchValue = true;

            this.toggleList = this.toggleList.map((item) =>{
                if(toggleKeyList.includes(item.toggleKey)){
                    item.switchValue = toggle[item.toggleKey].toggleState;
                }
                return item;
            });
            // console.log('this.toggleList 2222 ===>', this.toggleList);
        },
        reset(){
            this.switchValue = false;
            this.initToggle();
        }
    },
    mounted() {
        this.initToggle();
        this.setSaveValue();
        if(_.has(this.state,['toggle'],false)){
            this.changeSelect();
        }
    },
};
