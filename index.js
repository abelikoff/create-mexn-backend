#!/usr/bin/env node

import { program } from 'commander';
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

const getEntityList = (args) => {
    let result = [];
    let failed = false;

    for (const item of args) {
        if (item.charAt(0) !== item.charAt(0).toUpperCase()) {
            logError(`Entity '${item}' is not properly capitalized`);
            failed = true;
            continue;
        }

        if (result.find((entity) => { return entity === item })) {
            logError(`Duplicate entity: '${item}'`);
            failed = true;
            continue;
        }

        if (item === 'Users') {
            logError(`Entity '${item}': you probably meant 'User'`);
            failed = true;
            continue;
        }

        if (item === 'User') {      // ignore explicitly specified User entity
            continue;
        }

        result.push(item);
    }

    if (failed) {
        process.exit(1);
    }

    return result;
}


const expandFilename = (originalPath, entityName) => {
    let newPath = originalPath;

    newPath = newPath.replace('@@@Entity@@@', entityName);
    newPath = newPath.replace('@@@Entities@@@', entityName + 's');
    newPath = newPath.replace('@@@entity@@@', entityName.toLowerCase());
    newPath = newPath.replace('@@@entities@@@', entityName.toLowerCase() + 's');
    return newPath;
}


const generateFile = async (sourcePath, destPath, entityName) => {
    const destDir = path.dirname(destPath);
    const expansionData = {
        entity: entityName,
        entityLowerCase: entityName.toLowerCase(),
    };

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        logVerbose(`Writing file ${destPath}...`);
        const content = await renderFile(sourcePath, expansionData);
        fs.writeFileSync(destPath, content);
    } catch (err) {
        logError(`Failed to process file ${filePath}: ${err}`);
        return false;
    }

    return true;
}


// process command line

program.parse();
const entities = getEntityList(program.args);

if (entities.length < 1) {
    logFatal('At least one non-User entity must be specified');
}

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
    if (filePath.match(/@@@/)) {
        for (const entity of entities) {
            const destPath = expandFilename(filePath.replace('templates/', appDir + '/'), entity);
            success &&= await generateFile(filePath, destPath, entity);
        }
    }
    else {
        const destPath = filePath.replace('templates/', appDir + '/');
        success &&= await generateFile(filePath, destPath, "FIXME HERE");
    }
}

process.exit(success ? 0 : 1);
