const { exec } = require('child_process');
const path = require('path');

// 通用打包函数
function runBrowserify(inputFile, outputFile, moduleName) {
    return new Promise((resolve, reject) => {
        const browserifyCommand = `npx browserify ${inputFile} -t [ babelify --global --presets [ @babel/preset-env ] ] -s ${moduleName} -o ${outputFile}`;
        exec(browserifyCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during bundling ${path.basename(inputFile)}: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.error(`Stderr ${path.basename(inputFile)}: ${stderr}`);
            }
            console.log(`Stdout ${path.basename(inputFile)}: ${stdout}`);
            console.log(`Browserify bundling ${path.basename(inputFile)} completed successfully.`);
            resolve();
        });
    });
}

// 输入文件和输出文件的路径
const inputDeviceProtocol = path.join(__dirname, '..', 'src', 'utils', 'capabilitiesTransform.js');
const inputStateTransform = path.join(__dirname, '..', 'src', 'utils', 'stateTransform.js');
const outputDeviceProtocol = path.join(__dirname, '..', 'resources', 'js', 'capabilitiesTransform.js');
const outputStateTransform = path.join(__dirname, '..', 'resources', 'js', 'stateTransform.js');

// 顺序执行两个打包任务
(async () => {
    try {
        await runBrowserify(inputDeviceProtocol, outputDeviceProtocol, 'capabilitiesTransform');
        await runBrowserify(inputStateTransform, outputStateTransform, 'stateTransform');
    } catch (error) {
        console.error('Bundling process failed.', error);
    }
})();
