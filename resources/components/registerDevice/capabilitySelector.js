export const CapabilitySelector = {
    name: 'CapabilitySelector',
    template: `
        <div class="capability-selector">
            <div class="form-row" style="position: relative; display: flex;">
                <span class="require" :style="{ visibility: index !== 0 ? 'hidden' : 'visible' }">*</span>
                <label for="node-input-capabilities" :style="{ padding: '6px 3px 0 0', visibility: index !== 0 ? 'hidden' : 'visible' }">{{ getI18n('label.capabilities') }}</label>
                <div style="width: 70%; position: relative;">
                    <el-select
                        :class="{ 'cap-selector': true, 'error': !capabilityValue }"
                        :value="capabilityValue"
                        style="width: 100%;"
                        @change="changeCapability"
                    >
                        <el-option
                            v-for="option in capabilitiesOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                            :disabled="option.disabled"
                        />
                    </el-select>
                    <a class="add"
                        @click="addOrRemoveCapabilityItem"
                        :style="{
                            width: '30px',
                            height: '30px',
                            background: index !== 0 ? '#d6615f' : '#409EFF',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '50%',
                            marginTop: '-15px',
                            right: '-35px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#fff',
                            fontSize: '20px',
                            cursor: 'pointer',
                        }"
                    >
                        <i :class="[index === 0 ? 'el-icon-plus' : 'el-icon-minus']" />
                    </a>
                </div>
            </div>

            <div class="form-row">
                <div style="width: 70%; padding-left: 106px;">
                    <div class="config-item toggle-num" v-if="['toggle', 'multi-press'].includes(capabilityValue)">
                        <span>{{ getI18n('label.toggle_num') }}</span>
                        <div class="operation-area">
                            <el-select :class="{ 'config-selector': true }" :value="toggleNumValue" style="width: 100%;" @change="changeToggleNum">
                                <el-option v-for="i of 4" :key="i" :label="i" :value="i" />
                            </el-select>
                        </div>
                    </div>
                    <template v-if="ihostVersion !== 'V1'">
                        <div class="config-item name" v-if="showNameInput">
                            <span>{{ getI18n('modeName.name') }}</span>
                            <div class="operation-area">
                                <el-input :class="{ error: !capabilityData.name }" v-model:value="capabilityData.name" style="width: 100%;" />
                            </div>
                        </div>
                        <div class="config-item permission">
                            <span>{{ getI18n('permission.name') }}</span>
                            <div class="operation-area">
                                <el-select
                                    :class="{ 'config-selector': true, error: permissionValue.length === 0 }"
                                    :value="permissionValue"
                                    multiple
                                    style="width: 100%;"
                                    collapse-tags
                                    @change="changePermission"
                                >
                                    <el-option
                                        v-for="item in permissionOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </div>
                        </div>
                        <div class="config-item setting">
                            <span>{{ getI18n('setting.name') }}</span>
                            <div style="flex: 1">
                                <input type="text" :id="settingInputJsonId" style="width: 100%;">
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    `,
    props: [
        'nodeRed',
        'capabilitiesOptions',
        'capabilityData',
        'index',
        'ihostVersion',
        'requiredNameCapabilities'
    ],
    data() {
        return {
            settingJsonValue: '',
            permissionOptions: [
                { label: this.nodeRed._('register-device.permission.control'), value: 0 },
                { label: this.nodeRed._('register-device.permission.report'), value: 1 },
                { label: this.nodeRed._('register-device.permission.config'), value: 2 },
                { label: this.nodeRed._('register-device.permission.query'), value: 3 }
            ],
        }
    },
    computed: {
        settingInputJsonId() {
            return `capability-settings-${this.index}`
        },
        capabilityValue() {
            return this.capabilityData.capability;
        },
        permissionValue() {
            const { permission } = this.capabilityData;
            return permission
                .split('')
                .map((item, index) => item === '1' ? index : null)
                .filter(item => item !== null);
        },
        toggleNumValue() {
            return this.capabilityData.toggleNum ?? null;
        },
        showNameInput() {
            return this.requiredNameCapabilities.includes(this.capabilityValue);
        }
    },
    methods: {
        getI18n (key) {
            return this.nodeRed._(`register-device.${key}`);
        },
        changeCapability(value) {
            this.$emit('changeCapability', this.index, value);
        },
        changePermission(values) {
            const permission = [0, 0, 0, 0].map((_, index) => values.includes(index) ? 1 : 0).join('');
            this.$emit('changePermission', this.index, permission);
        },
        changeSettings(value) {
            this.$emit('changeSettings', this.index, value);
        },
        changeToggleNum(value) {
            this.$emit('changeToggleNum', this.index, value);
        },
        addOrRemoveCapabilityItem() {
            this.$emit('addOrRemoveCapabilityItem', this.index);
        },
        jsonInputChange(e) {
            this.changeSettings(e.target.value);
        },
        initJsonTypeInput() {
            const that = this;
            $(`#${this.settingInputJsonId}`)
                .val(this.capabilityData.settings)
                .typedInput({ type: 'json', types: ['json'] });
            this.$nextTick(() => {
                const jsonInput = $(`#${this.settingInputJsonId} + .red-ui-typedInput-container .red-ui-typedInput-input`);
                if (jsonInput) {
                    jsonInput.off('change', that.jsonInputChange);
                    jsonInput.on('change', that.jsonInputChange);
                    jsonInput.off('input',that.jsonInputChange);
                    jsonInput.on('input', that.jsonInputChange);
                }
            });
        }
    },
    watch: {
        ihostVersion(val) {
            if (val === 'V2') {
                this.$nextTick(this.initJsonTypeInput);
            }
        }
    },
    mounted() {
        this.initJsonTypeInput();
    },
    beforeDestroy() {
        const that = this;
        const jsonInput = $(`#${this.settingInputJsonId} + .red-ui-typedInput-container .red-ui-typedInput-input`);
        if (jsonInput) {
            jsonInput.off('change', that.jsonInputChange);
            jsonInput.off('input', that.jsonInputChange);
        }
    }
}
