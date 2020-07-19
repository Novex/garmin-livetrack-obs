const log = require('signale').scope('TextOutputter');
const fs = require('fs');
const path = require('path');
const template = require('es6-template-strings');

function OutputFile(outputFolder, outputFilename, value) {
    const filePath = path.join(outputFolder, outputFilename);

    fs.mkdir(outputFolder, { recursive: true }, (err) => {
        if (err) {
            log.error(`Error creating directory path ${outputFolder}: ${err}`);
            return;
        }

        log.info(`Outputting ${filePath}`)
        
        fs.writeFile(filePath, value, (err) => {
            if (err) {
                log.error(`Error writing to ${filePath}: ${err}`);
            }
        });
    });
}

function OutputToTextFiles(outputFolder, outputTemplates, data) {
    outputTemplates = Object.assign({}, outputTemplates);
    data = data || {};

    // Output all the data entries
    Object.entries(data).forEach(([key, dataValue]) => {
        if (dataValue == null) {
            return;
        }

        const templateValue = outputTemplates[key];

        // Recurse if we have sub-objects
        if (typeof dataValue === 'object') {
            const subPath = path.join(outputFolder, key);
            OutputToTextFiles(subPath, templateValue, dataValue);
            delete outputTemplates[key];

            return;
        }

        // Default to JSON output for arrays if there's no template specified
        if (typeof dataValue === 'array' && templateValue != null) {
            dataValue = JSON.stringify(dataValue);
        }
        
        // Remove the template that was used so it doesn't get re-done when we do the advanced templates
        delete outputTemplates[key];

        // Process the template if there is one
        if (templateValue != null) {
            try {
                const dataValue = template(templateValue, data);
            } catch(e) {
                log.warn(`Error in ${key}:\n${e.message}\n\nWhile rendering '${templateValue}' with data ${JSON.stringify(data)}`);
                return;
            }
        }

        OutputFile(outputFolder, `${key}.txt`, dataValue);
    });

    // Output any advanced custom templates that don't correspond directly to a piece of data
    Object.entries(outputTemplates).forEach(([key, templateValue]) => {
        if (templateValue == null) {
            return;
        }

        // Any sub-objects would have been recursed into and removed by the data entry forEach,
        // so if we have one here it doesn't make sense because there's no data for it
        if (typeof templateValue === 'object') {
            log.error(`Ignoring output template ${key} because it doesn't correspond to any data`);
            return;
        }

        let dataValue = "";
        try {
            dataValue = template(templateValue, data);
        } catch(e) {
            log.warn(`Error in ${key}:\n${e.message}\n\nWhile rendering '${templateValue}' with data ${JSON.stringify(data)}`);
            return;
        }

        OutputFile(outputFolder, `${key}.txt`, dataValue);
    });
}

module.exports = { 
    OutputToTextFiles: OutputToTextFiles,
    OutputFile: OutputFile
}