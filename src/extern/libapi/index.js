const gatewayInfoMap = require('../../utils/gatewayInfoMap');

const { ihostApi: ApiClientV1 } = require('./v1').default;
const { ihostApi: ApiClientV2 } = require('./v2').default;

function getApiClientClass(apiServerId) {
    if (gatewayInfoMap.get(apiServerId)?.isV2) {
        return ApiClientV2;
    }
    return ApiClientV1;
}

exports.default = getApiClientClass;
