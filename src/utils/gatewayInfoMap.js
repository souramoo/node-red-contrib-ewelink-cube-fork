/** 记录token和网关信息映射，用于open-api使用v1还是v2的判断依据
 * （Record the mapping of token and gateway information, which is used to determine whether open-api should use v1 or v2.） 
 * atToken :{ 
 * ip: '192.168.*.*',
  mac: '',
  domain: 'ihost.local',
  fw_version: '2.1.0',
  name: 'iHost',
  isV2: true
  }
*/
const gatewayInfoMap = new Map();

module.exports = gatewayInfoMap;
