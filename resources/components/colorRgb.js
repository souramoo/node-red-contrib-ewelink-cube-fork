const DIV_HEIGHT = 120;
const DIV_WIDTH = 456;
const HALF_CIRCLE_LENGTH = 12;
const HUE_RANGE = 359;
const SATURATION_RANGE = 100;
const VALUE_RANGE = 100;

// 取色点的实际落点范围
const REAL_HEIGHT = 96;
const REAL_WIDTH = 432;
// 饱和度校准值，防止饱和度取为0时，取色点飘到最左侧
const CALIBRATION_HEIGHT = 1;

export const ColorRgb = {
    template: `
        <div class="card">
            <div class="color-header">
                <div class="color-input">
                    <div class="title">{{title}}</div>
                    <div class="color-circle" :style="rgbCircleStyle"></div>

                    <div class="rgb-input">
                        <span style="margin-right:4px">R</span>
                        <el-input-number style="width:66px;height:26px" :min="0" :max="255" v-model="rVal" :disabled="!switchValue" @change="(val) => changeColorInput(val,'rVal')"></el-input-number>
                        <div class="btn">
                            <div class="up" :style="{ cursor: (rVal === 255 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('rVal','add')"><i class="el-icon-arrow-up"></i></div>
                            <div class="down" :style="{ cursor: (rVal === 0 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('rVal','down')"><i class="el-icon-arrow-down"></i></div>
                        </div>
                    </div>
                    <div class="rgb-input">
                        <span style="margin-right:4px">G</span>
                        <el-input-number style="width:66px;height:26px" :min="0" :max="255" v-model="gVal" :disabled="!switchValue" @change="(val) => changeColorInput(val,'gVal')"></el-input-number>
                        <div class="btn">
                            <div class="up" :style="{ cursor: (gVal === 255 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('gVal','add')"><i class="el-icon-arrow-up"></i></div>
                            <div class="down" :style="{ cursor: (gVal === 0 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('gVal','down')"><i class="el-icon-arrow-down"></i></div>
                        </div>
                    </div>
                    <div class="rgb-input">
                        <span style="margin-right:4px">B</span>
                        <el-input-number style="width:66px;height:26px" :min="0" :max="255" v-model="bVal" :disabled="!switchValue" @change="(val) => changeColorInput(val,'bVal')"></el-input-number>
                        <div class="btn">
                            <div class="up" :style="{ cursor: (bVal === 255 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('bVal','add')"><i class="el-icon-arrow-up"></i></div>
                            <div class="down" :style="{ cursor: (bVal === 0 || !switchValue) ? 'not-allowed' : 'pointer' }" @click="hadleRgbValue('bVal','down')"><i class="el-icon-arrow-down"></i></div>
                        </div>
                    </div>

                </div>
                <el-switch
                    v-model="switchValue"
                    inactive-color="#cccc"
                    @change="changeSwitch"
                    :disabled="disabled"
                >
                </el-switch>
            </div>
            <div
                class="rgb-background-wrap"
                @mousedown="mouseDown"
                @click="clickRgb"
                :class="{ disable: colorRgbDisabled }"
                @mousemove="mousemove"
                @mouseup="mouseUp"
                @mouseleave="mouseleave"
                v-if="switchValue"
            >
                <div
                    class="trigger-circle"
                    @click="(e) => e.stopPropagation()"
                    :style="{
                        left: circleLeft+'px',
                        top: circleTop+'px',
                        width: CIRCLE_LENGTH+'px',
                        height: CIRCLE_LENGTH+'px',
                    }"
                ></div>
            </div>
        </div>
    `,
    props: ['nodeRed', 'state', 'deviceData'],
    data() {
        return {
            title: this.nodeRed._('control-device.label.colorRgb'),
            colorRgbValue: 50,
            switchValue: false,
            defaultValue: { red: 255, green: 0, blue: 0 },
            circleLeft: 24,
            circleTop: 24,
            colorRgbDisabled: false,
            canSend: false,
            CIRCLE_LENGTH: 24,
            disabled: false,
            rVal: 255,
            gVal: 0,
            bVal: 0,
        };
    },
    watch: {
        state: {
            handler(newVal) {
                if (Object.keys(newVal).length === 0) {
                    this.reset();
                }
                // power联动
                const linkRalation = !this.state.power || ['reverse', 'off'].includes(this.state.power.powerState);
                if (this.hasPower && linkRalation) {
                    this.disabled = true;
                    this.switchValue = false;
                } else {
                    this.disabled = false;
                }
                // 色温颜色互斥
                if (this.state['color-temperature']) {
                    this.switchValue = false;
                }
                // 模式联动
                const lightMode = _.get(this.state, ['mode', 'lightMode', 'modeValue'], '');
                if (this.hasModeLight && ['whiteLight', 'colorTemperature'].includes(lightMode)) {
                    this.switchValue = false;
                    this.disabled = true;
                }
            },
            immediate: true,
            deep: true,
        }
    },
    computed: {
        hasPower() {
            if (!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'power');
        },
        hasModeLight() {
            if (!this.deviceData || !this.deviceData.capabilities) return false;
            return this.deviceData.capabilities.some((item) => item.capability === 'mode' && item.name === 'lightMode');
        },
        rgbCircleStyle() {
            if(!this.switchValue){
                return {
                    display:'none'
                }
            }

            const [h, s, v] = rgbToHsv(this.rVal, this.gVal, this.bVal);
            let [ red, green, blue ] = [this.rVal, this.gVal, this.bVal];
            // 兼容 rgb 黑色的情况
            if (v < 100) {
                const [r, g, b] = hsvToRgb(h, s, 100);
                red = r;
                green = g;
                blue = b;
            }
            return {
                background: `rgb(${red},${green},${blue})`,
                border: `4px solid rgba(${red},${green},${blue},0.3)`,
                'background-clip': 'content-box',
            };
        },
    },
    methods: {
        callBack(state, deleteFlag) {
            const data = {
                'color-rgb': state,
            };
            this.$emit('call-back', data, deleteFlag);
        },
        changeSwitch(value) {
            this.colorRgbValue = this.defaultValue;
            this.callBack(this.defaultValue, !value);
            this.initColorPickerVal(value);
            if (value) this.$emit('call-back', { 'color-temperature': {} }, true);
        },
        mouseDown() {
            this.canSend = true;
        },
        mousemove(event) {
            if (!this.canSend) {
                return;
            }
            this.setDragPosition(event);
            this.changeRgb();
        },
        mouseUp() {
            this.canSend = false;
        },
        mouseleave() {
            this.canSend = false;
        },
        clickRgb(event) {
            this.setDragPosition(event);
            this.changeRgb();
        },
        changeRgb() {
            const rgbObj = this.position2rgb(this.circleLeft, this.circleTop);
            this.setColorPicker(rgbObj);
            this.callBack(
                {
                    red: Math.round(rgbObj.red),
                    green: Math.round(rgbObj.green),
                    blue: Math.round(rgbObj.blue),
                },
                false
            );
        },
        setColorPicker(rgbObj) {
            this.rVal = Math.round(rgbObj.red);
            this.gVal = Math.round(rgbObj.green);
            this.bVal = Math.round(rgbObj.blue);
        },
        changeColorInput(val, type) {
            // 不能输入(0,0,0)的黑色
            if(Number(this.rVal) === 0 && Number(this.gVal) === 0 && Number(this.bVal) === 0){
                this[type] = undefined;
                RED.notify(`control-device: ${this.nodeRed._('control-device.message.rgb_cannot_be_all_zero')}`, { type: 'warning' });
                return;
            }

            // limit range
            if (val >= 255){
                this[type] = 255;
                // RED.notify(`control-device: ${this.nodeRed._('control-device.message.rgb_range')}`, { type: 'warning' });
            }
            if (val <= 0 || val === '') {
                this[type] = 0;
            }

            const state = {
                red: Math.round(_.cloneDeep(this.rVal)),
                green: Math.round(_.cloneDeep(this.gVal)),
                blue: Math.round(_.cloneDeep(this.bVal)),
            };
            this.setCirclePosition(state);
            this.callBack(state, false);
        },
        setDragPosition(event) {
            const { offsetX, offsetY } = event;

            const { x, y } = this.toCorrectPosition(offsetX, offsetY);
            this.circleLeft = x;
            this.circleTop = y;
        },
        position2rgb(x, y) {
            let h1 = ((x - HALF_CIRCLE_LENGTH) / REAL_WIDTH) * HUE_RANGE;
            let s1 = ((y - HALF_CIRCLE_LENGTH) / REAL_HEIGHT) * SATURATION_RANGE;
            const [h, s] = this.toCorrectHs(h1, s1);

            const value = VALUE_RANGE;
            const [red, green, blue] = hsvToRgb(h, s, value);

            this.setCirclePosition({ red, green, blue });
            return { red, green, blue };
        },
        // 校正色相，防止取色点选择后跳变
        toCorrectHs(h, s) {
            const [red, green, blue] = hsvToRgb(parseInt(h), parseInt(s), VALUE_RANGE);
            const [hue] = rgbToHsv(parseInt(red), parseInt(green), parseInt(blue));

            // 判断转换后到色相由359变成了0，就直接改变取色点到位置，让取色点不在最右侧最上方的位置
            if (h >= 350 && hue === 0) {
                return [355, 4];
            }
            return [h, s];
        },
        rgb2position(red, green, blue) {
            const [h, s] = rgbToHsv(red, green, blue);

            const x = (h / HUE_RANGE) * REAL_WIDTH + HALF_CIRCLE_LENGTH;
            const y = (s / SATURATION_RANGE) * REAL_HEIGHT + HALF_CIRCLE_LENGTH;

            return this.toCorrectPosition(x, y);
        },
        toCorrectPosition(x, y) {
            y = Math.max(HALF_CIRCLE_LENGTH, Math.min(DIV_HEIGHT - HALF_CIRCLE_LENGTH, y));
            x = Math.max(HALF_CIRCLE_LENGTH, Math.min(DIV_WIDTH - HALF_CIRCLE_LENGTH, x));
            // 解决取色点在顶部时hue为0，导致取色点定位错误问题
            if (y === HALF_CIRCLE_LENGTH && x !== HALF_CIRCLE_LENGTH) {
                y = HALF_CIRCLE_LENGTH + CALIBRATION_HEIGHT;
            }

            return { x, y };
        },
        setCirclePosition(rgbObj) {
            const { red, green, blue } = rgbObj;
            const { x, y } = this.rgb2position(red, green, blue);

            this.circleLeft = x;
            this.circleTop = y;
        },
        reset() {
            this.switchValue = false;
            this.setCirclePosition(this.defaultValue);
        },
        getRgbCircleStyle(colorRgb) {
            let { red, green, blue } = colorRgb;
            const [h, s, v] = rgbToHsv(red, green, blue);

            // 兼容 rgb 黑色的情况
            if (v < 100) {
                const [r, g, b] = hsvToRgb(h, s, 100);
                red = r;
                green = g;
                blue = b;
            }
            return {
                background: `rgb(${red},${green},${blue})`,
                border: `4px solid rgba(${red},${green},${blue},0.3)`,
                'background-clip': 'content-box',
            };
        },
        initColorPickerVal(val){
            this.rVal = val ? 255 : undefined;
            this.gVal = val ? 0 : undefined;
            this.bVal = val ? 0 : undefined;
        },
        hadleRgbValue(type, handleType){
            if(typeof this[type] !== 'number' || !this.switchValue){
                return;
            }
            if(handleType === 'add'){
                this[type]+=1
            }
            if(handleType === 'down'){
                this[type]-=1
            }
            // 不能输入(0,0,0)的黑色
            if(Number(this.rVal) === 0 && Number(this.gVal) === 0 && Number(this.bVal) === 0){
                this[type] = undefined;
                RED.notify(`control-device: ${this.nodeRed._('control-device.message.rgb_cannot_be_all_zero')}`, { type: 'warning' });
                return;
            }

            const state = {
                red: Math.round(_.cloneDeep(this.rVal)),
                green: Math.round(_.cloneDeep(this.gVal)),
                blue: Math.round(_.cloneDeep(this.bVal)),
            };
            this.setCirclePosition(state);
            this.callBack(state, false);
        }
    },
    mounted() {
        if (!this.state.power && this.hasPower) {
            this.switchValue = false;
            this.disabled = true;
            return;
        }
        if (this.state['color-rgb']) {
            this.switchValue = true;
            this.setCirclePosition(this.state['color-rgb']);
            this.setColorPicker(this.state['color-rgb']);
        }else{
            this.initColorPickerVal(false);
        }
    },
};
