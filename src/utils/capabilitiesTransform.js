const rule = require('./protocolRule');
const _ = require('lodash');
const { CAPA_MAP } = require('./const');

const specialConvertCapabilityNames = ['startup'];
const specialRestoreCapabilityNames = ['toggle-startup'];

function _convertStartup(capabilityInfo) {
    const convertStartups = [];
    if (capabilityInfo.capability !== 'startup') {
        return convertStartups;
    }

    if (Array.isArray(capabilityInfo.components)) {
        for (const component of capabilityInfo.components) {
            if (component.capability !== 'toggle') continue;
            const convertCapabilityInfo = {
                capability: `toggle-startup`,
                permission: capabilityInfo.permission,
                name: component.name,
            };
            convertStartups.push(rule[convertCapabilityInfo.capability].convert(convertCapabilityInfo));
        }
        return convertStartups;
    }
    convertStartups.push(rule[capabilityInfo.capability].convert(capabilityInfo));
    return convertStartups;
}

function _convertSpecialCapabilities(specialConvertCapabilities) {
    const convertCapabilities = [];
    for (const capabilityInfo of specialConvertCapabilities) {
        const convertStartups = _convertStartup(capabilityInfo);
        if (convertStartups.length > 0) convertCapabilities.push(...convertStartups);
    }
    return convertCapabilities;
}

function _restoreToggleStartup(toggleStartupCapabilities) {
    if (toggleStartupCapabilities.length <= 0) return;
    const baseRestoreToggleStartup = rule['toggle-startup'].restore(toggleStartupCapabilities[0]);
    const restoreToggleStartup = {
        capability: 'startup',
        permission: baseRestoreToggleStartup.permission,
        components: [],
    };
    for (const toggleStartupCapability of toggleStartupCapabilities) {
        restoreToggleStartup.components.push({
            capability: 'toggle',
            name: toggleStartupCapability.name,
        });
    }
    return restoreToggleStartup;
}

function _restoreSpecialCapabilities(specialCapabilitiesRestore) {
    const restoreCapabilities = [];
    const toggleStartupCapabilities = [];
    for (const capabilityInfo of specialCapabilitiesRestore) {
        if (capabilityInfo.capability === 'toggle-startup') toggleStartupCapabilities.push(capabilityInfo);
    }

    const toggleStartupConvert = _restoreToggleStartup(toggleStartupCapabilities);
    if (toggleStartupConvert) restoreCapabilities.push(toggleStartupConvert);

    return restoreCapabilities;
}

/**
 * 旧协议转新协议
 * @param {object} ctx
 * @param {array}  ctx.capabilities
 * @returns
 */
function v1CapabilityToV2Capability(capabilities = []) {
    const convertCapabilities = [];
    const needSpecialCapabilitiesConvert = [];

    for (const capabilityInfo of capabilities) {
        if (!rule[capabilityInfo.capability]) {
            convertCapabilities.push(capabilityInfo);
            continue;
        }
        if (specialConvertCapabilityNames.includes(capabilityInfo.capability)) {
            needSpecialCapabilitiesConvert.push(capabilityInfo);
            continue;
        }

        convertCapabilities.push(rule[capabilityInfo.capability].convert(capabilityInfo));
    }

    const specialCapabilitiesConverts = _convertSpecialCapabilities(needSpecialCapabilitiesConvert);
    if (specialCapabilitiesConverts.length > 0) convertCapabilities.push(...specialCapabilitiesConverts);

    return convertCapabilities;
}

/**
 * 新协议恢复为旧协议
 * @param {object} ctx
 * @param {array}  ctx.capabilities
 * @returns
 */
function v2CapabilityToV1Capability(capabilities = []) {
    const restoreCapabilities = [];
    const needSpecialCapabilitiesRestore = [];
    for (const capabilityInfo of capabilities) {
        if (!rule[capabilityInfo.capability]) {
            restoreCapabilities.push(capabilityInfo);
            continue;
        }

        if (specialRestoreCapabilityNames.includes(capabilityInfo.capability)) {
            needSpecialCapabilitiesRestore.push(capabilityInfo);
            continue;
        }

        restoreCapabilities.push(rule[capabilityInfo.capability].restore(capabilityInfo));
    }

    const specialCapabilitiesRestores = _restoreSpecialCapabilities(needSpecialCapabilitiesRestore);
    if (specialCapabilitiesRestores.length > 0) restoreCapabilities.push(...specialCapabilitiesRestores);

    return restoreCapabilities;
}

function frontEndDataToV1Capability(capaData) {
    // {
    //     toggleNum: '1',
    //     values: ['power']
    // }
    const toggleNum = parseInt(capaData.toggleNum);
    const result = [];
    for (const value of capaData.values) {
        const found = _.find(CAPA_MAP, { capability: value });
        if (!found) {
            continue;
        } else {
            if (value === 'toggle') {
                for (let i = 0; i < toggleNum; i++) {
                    const copy = _.cloneDeep(found);
                    _.set(copy, 'name', `${i + 1}`);
                    result.push(copy);
                }
            } else {
                result.push(found);
            }
        }
    }
    return result;
}

/** 前端老数据转换成V2新协议能力配置 */
function frontEndDataToV2Capability(capaData){
    const v1CapabilityData = frontEndDataToV1Capability(capaData)
    const v2CapabilityData = v1CapabilityToV2Capability(v1CapabilityData)
    return v2CapabilityData
 }



module.exports = {
    frontEndDataToV1Capability,
    v1CapabilityToV2Capability,
    v2CapabilityToV1Capability,
    frontEndDataToV2Capability
};
