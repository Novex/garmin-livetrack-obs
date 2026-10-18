const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createPoller() {
    const outputs = [];
    const warnings = [];
    let responseData;
    let poll;
    const dependencies = {
        signale: {
            scope: () => ({ info() {}, warn: message => warnings.push(message) })
        },
        './lib/MailWatcher': class {
            constructor() {
                this.sessionInfo = { Id: 'test-session', Token: 'test-token' };
            }
        },
        'node-fetch': async () => ({ status: 200, json: async () => responseData }),
        './lib/TextOutputter': {
            OutputFile: (folder, filename, data) => outputs.push({ filename, data }),
            OutputToTextFiles: (folder, templates, data) => outputs.push({ templates, data })
        },
        './package.json': require('../package.json'),
        './config.js': {}
    };

    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8'), {
        require: id => Object.prototype.hasOwnProperty.call(dependencies, id)
            ? dependencies[id]
            : require(id),
        setInterval: callback => { poll = callback; }
    }, { filename: 'index.js' });

    return {
        outputs,
        warnings,
        async poll(data) {
            responseData = data;
            await poll();
        }
    };
}

async function main() {
    const waiting = createPoller();
    await waiting.poll({ trackPoints: [] });
    await waiting.poll({ trackPoints: [] });
    assert.strictEqual(waiting.outputs.length, 0, 'Empty polls must not overwrite OBS output');
    assert.strictEqual(waiting.warnings.length, 2, 'Each empty poll should explain why output is delayed');

    const firstPoint = { speed: 3, fitnessPointData: { speedMetersPerSec: 3 } };
    await waiting.poll({ trackPoints: [firstPoint] });
    assert.strictEqual(waiting.outputs.length, 2, 'Polling must recover once a trackpoint arrives');
    assert.strictEqual(waiting.outputs[1].data, firstPoint);
    await waiting.poll({ trackPoints: [] });
    assert.strictEqual(waiting.outputs.length, 2, 'An empty later response must preserve the last output');
    console.log('PASS: empty responses are skipped and later polling recovers');

    const noSpeed = createPoller();
    const partialPoint = { fitnessPointData: { distanceMeters: 12 } };
    await noSpeed.poll({ trackPoints: [partialPoint] });
    assert.strictEqual(noSpeed.outputs[1].data.speed, 0);
    assert.strictEqual(noSpeed.outputs[1].data.fitnessPointData.speedMetersPerSec, 0);
    await noSpeed.poll({ trackPoints: [{}] });
    assert.strictEqual(noSpeed.outputs[3].data.speed, 0);
    assert.strictEqual(noSpeed.outputs[3].data.fitnessPointData, undefined);
    console.log('PASS: existing missing-speed defaults are preserved');

    const normal = createPoller();
    const newestPoint = { speed: 5, fitnessPointData: { speedMetersPerSec: 5 } };
    await normal.poll({ trackPoints: [{ speed: 1 }, newestPoint] });
    assert.strictEqual(normal.outputs[0].filename, 'trackpoints.json');
    assert.strictEqual(normal.outputs[1].data, newestPoint);
    assert.strictEqual(newestPoint.speed, 5);
    assert.strictEqual(newestPoint.fitnessPointData.speedMetersPerSec, 5);
    assert.strictEqual(normal.warnings.length, 0);
    console.log('PASS: normal responses still output the newest trackpoint');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
