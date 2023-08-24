#!/usr/bin/env node

//import { program } from 'commander';
import template_file from 'template-file';
const { renderFile } = template_file;
import fs from 'fs';
import path from 'path';
import { setVerboseMode, logVerbose, logError, logFatal } from './util.js';

const getFileList = (dirName) => {
    let files = [];
    const items = fs.readdirSync(dirName, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFileList(`${dirName}/${item.name}`)];
        } else {
            files.push(`${dirName}/${item.name}`);
        }
    }

    return files;
};


const data = {
    app_name: 'foobar',
    location: { name: 'Nashville' },
    adjective: 'cool',
};

setVerboseMode(true);

const appDir = 'kazoo';

try {
    fs.mkdirSync(appDir);
} catch (err) {
    logFatal("cannot create directory '" + appDir + "'");
}

let success = true;

const templateFiles = getFileList('templates');

for (const filePath of templateFiles) {
    const destPath = filePath.replace('templates/', appDir + '/');
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        logVerbose(`Writing file ${destPath}...`);
        const content = await renderFile(filePath, data);
        fs.writeFileSync(destPath, content);
    } catch (err) {
        logError(`Failed to process file ${filePath}: ${err}`);
        success = false;
    }
}

process.exit(success ? 0 : 1);
