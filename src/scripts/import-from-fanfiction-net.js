const { Story, DataAccessObject } = require('../api/fanfiction-net-api');
// const incrspace = require('@stdlib/math/utils/incrspace');
const connectionParams = require('../../local.js').databaseConnection;
const Promise = require('bluebird');

const argvs = require('minimist')(process.argv.slice(2));

const min = argvs.min || 0;
const max = argvs.max || 1000;

// const idRange = incrspace(min, max);
const idRange = Array.from({length: max - min}, (_, i) => i + min);
console.log(`script.import-from-fanfiction-net.js - idRange = ${idRange}`);

async function saveStory(storyId, storyDAO) {
    if (!storyId) {
        return false;
    }
    const story = new Story(storyId);
    await story.fetchData();
    story.parseData();
    await story.loadChapters();
    await storyDAO.insertStory(story);
    return true;
}

const dao = new DataAccessObject(connectionParams);

dao.hasTables().then(res => {
    if (res === false) {
        console.log('script.import-from-fanfiction-net.js - creating tables...');
        return dao.createTables();
    }
    console.log('script.import-from-fanfiction-net.js - tables already exist.');
}).then(() => {
    return Promise.map(idRange, async id => {
        const res = await saveStory(id, dao);
        console.log(`script.import-from-fanfiction-net.js - Story #${id} has been stored with exit ${res}`);
        return { id, res };
    }, {
        concurrency: 3
    });
}).then(results => {
    console.log(`script.import-from-fanfiction-net.js - results are: ${results}`);
}).catch(err => {
    console.log(`script.import-from-fanfiction-net.js - error caught: ${err}`);
});
