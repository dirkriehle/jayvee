// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
//@ts-check

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { getSourcePath } from "../shared-util.mjs";
import { join } from "path";

const projectName = 'language-server';
const stdLibInputPath = 'stdlib';
const outputDirPath = join('lib', 'builtin-library', 'generated');
const outputFilePath = join(outputDirPath, 'partial-stdlib.ts');

// Executing this script: node path/to/generate-stdlib.mjs
console.log('Generating stdlib...');
const sourcePath = getSourcePath(projectName);
if (sourcePath === undefined) {
    throw Error(`Project ${projectName} does not exist!`);
}
process.chdir(sourcePath);

console.log(`Reading jv files from directory ${sourcePath}/${stdLibInputPath}`)
const libsArray = readLibrariesFromDirectory([stdLibInputPath]);
const libsRecord = {};
libsArray.forEach(lib => {
    libsRecord[lib.name] = lib.content;
})

console.log(`Writing standard lib to file ${sourcePath}/${outputFilePath}`)
const stdlibOutput = `/******************************************************************************
* This file was generated by tools/scripts/language-server/generate-stdlib.mjs.
* DO NOT EDIT MANUALLY!
******************************************************************************/

` + 'export const PartialStdLib = ' + JSON.stringify(libsRecord, null, 2) + ';\n';
if (!existsSync(outputDirPath)) {
    mkdirSync(outputDirPath, {recursive: true});
}
writeFileSync(outputFilePath, stdlibOutput, { encoding: 'utf8', flag: 'w'});

/**
 * Recursively reads all libraries in the given directory.
 * @param pathParts a list of the parts in the path
 * @returns a list of all libraries with their names and their string content.
 * Note that the name of a library follows this pattern: "builtin:///${filePath}"
 */
function readLibrariesFromDirectory(pathParts) {
    const path = join(...pathParts);
    const libs = [];

    readdirSync(path, { withFileTypes: true })
        .filter((file) => !file.isDirectory())
        .filter((file) => file.name.endsWith('.jv'))
        .forEach((file) => {
            const libName = file.name;
            const libPath = `${path}/${libName}`;
            const libContent = readFileSync(libPath);
            libs.push({
                name: `builtin:///${libPath}`,
                content: libContent.toString(),
        });
    });

    readdirSync(path, { withFileTypes: true })
        .filter((file) => file.isDirectory())
        .forEach((directory) => {
            const libsOfSubdir = readLibrariesFromDirectory([path, directory.name]);
            libs.push(...libsOfSubdir);
        });
    
    return libs;
}