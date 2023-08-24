import chalk from 'chalk';

let verboseMode = false;

export function setVerboseMode(turnOn) {
    verboseMode = turnOn;
}

export function logError(str) {
    console.log(chalk.red.bold('ERROR: ' + str));
};

export function logFatal(str) {
    console.log(chalk.red.bold('ERROR: ' + str));
    process.exit(1);
};

export function logVerbose(str) {
    if (verboseMode) {
        console.log(chalk.cyan(str));
    }
};
