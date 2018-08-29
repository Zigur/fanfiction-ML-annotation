// const parseArgs = require('minimist');
const { Story, DataAccessObject } = require('../api/fanfiction-net-api');

const argvs = require('minimist')(process.argv.slice(2));

const min = argvs.min || 0;
const max = argvs.max || 1000;

for (let i = min; i < max; i++) {
    
}
