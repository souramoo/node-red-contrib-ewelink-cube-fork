// import * as multicastDns from 'multicast-dns';

const mDNS = require('multicast-dns');
const { IhostListCache } = require('./Ihost');
const mdns = mDNS();
let ihostList = new IhostListCache();

// query "_http._tcp.local" services
// mdns.query({
//     questions: [
//         {
//             name: '_ewelink._tcp.local',
//             type: 'PTR',
//         },
//     ],
// });

mdns.on('response', (response) => {
    const { answers, authorities, additionals } = response;
    const allRecords = [...answers, ...authorities, ...additionals];
    // console.log('allRecords-------------------------------', allRecords);
    for(const item of allRecords){
        const isIhost = item.name.indexOf('ihost') !== -1;
        const isNSPanelPro = item.name.indexOf('NSPanelPro') !== -1;
        const isCube = item.name.indexOf('cube') !== -1;
        if(item.type === 'A' && ( isIhost || isNSPanelPro || isCube)){
            // console.log(`mDNS record, name: ${item.name}, ip: ${item.data}`);
            ihostList.add({
                name:item.name,
                ip:item.data
            });
        }
    }
    // console.log('ihost-------------------->',ihostList);
});

function clean(){
    ihostList = [];
}

// export default mdns;
module.exports = {
    mdns,
    ihostList,
    clean
}
