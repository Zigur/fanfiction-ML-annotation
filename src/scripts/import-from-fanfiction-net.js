const { Story, DataAccessObject } = require('../api/fanfiction-net-api');
const incrspace = require('@stdlib/math/utils/incrspace');
const connectionParams = require('../../local.js').databaseConnection;

const argvs = require('minimist')(process.argv.slice(2));

const min = argvs.min || 0;
const max = argvs.max || 1000;

const range = incrspace(min, max);

async function saveStory(storyId, storyDAO) {
    if (!storyId) {
        return false;
    }
    const story = Story(storyId);
    await story.fetchData();
    story.parseData();
    await story.loadChapters();
    await storyDAO.insertStory(story);
    return true;
}

const dao = new DataAccessObject(connectionParams);
Promise.all(range.map(id => saveStory(id, dao))).then(results => {
    console.log(results);
});
