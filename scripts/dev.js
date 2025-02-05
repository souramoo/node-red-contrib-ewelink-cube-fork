'use strict';

const process = require('process');
const nodemon = require('nodemon');
const browsersync = require('browser-sync').create('node-red proxy');

let nodemonCmd = '';
let nodemonInst = null;
let browsersyncInst = null;

if (process.argv[2] === '--win') {
    nodemonCmd = '-L -e js,html --exec node-red';
} else {
    nodemonCmd = '-w ./src -e js,html --exec node-red';
}

nodemonInst = nodemon(nodemonCmd);
nodemonInst.on('start', () => {
    if (browsersyncInst) {
        browsersync.reload();
    } else {
        browsersyncInst = browsersync.init({
            ui: false,
            open: false,
            proxy: {
                target: 'http://localhost:1880',
                ws: true
            },
            files: 'src',
            reloadDelay: 3000
        });
    }
});
