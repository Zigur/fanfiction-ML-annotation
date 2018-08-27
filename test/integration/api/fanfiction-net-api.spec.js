const expect = require('chai').expect;
const DataAccessObject = require('../../../src/api/fanfiction-net-api').DataAccessObject;
const Story = require('../../../src/api/fanfiction-net-api').Story;
const connectionParams = require('../../../local.js').databaseConnection;
const CONSTANTS = require('../../../src/api/fanfiction-net-api').CONSTANTS;

describe('DataAccessObject', function() {

    let dao;

    beforeEach(function() {
        dao = new DataAccessObject(connectionParams);
    });

    describe('createTables', function() {
        it('successfully creates the tables and drops them', async function() {

            let flag = await dao.createTables();
            let res = await Promise.all([
                dao.knex.schema.hasTable('author'),
                dao.knex.schema.hasTable('fandom'),
                dao.knex.schema.hasTable('story'),
                dao.knex.schema.hasTable('chapter'),
                dao.knex.schema.hasTable('story_fandom')
            ]);
            expect(flag).not.to.be.null;
            for (const el of res) {
                expect(el).to.be.true;
            } 
            flag = await dao.dropTables();
            res = await Promise.all([
                dao.knex.schema.hasTable('author'),
                dao.knex.schema.hasTable('fandom'),
                dao.knex.schema.hasTable('story'),
                dao.knex.schema.hasTable('chapter'),
                dao.knex.schema.hasTable('story_fandom')
            ]);
            for (const el of res) {
                expect(el).to.be.false;
            }
                
        });
    });

    describe('insertStory', function() {

        before(async function() {
            await dao.createTables();
            console.log('insertStory.before() hook - tables have been created.');   
        });

        after(async function() {
            await dao.dropTables();
            console.log('insertStory.after() hook - tables have been successfully dropped.');  
            console.log('insertStory.after() hook - exiting...');   
        });

        it('insert a story with a few chapters', async function() {
            const { TABLES, STORY_FIELDS, CHAPTER_FIELDS } = CONSTANTS;
            const story = new Story(12);
            let res, counts, select;
            try {
                await story.fetchData();
                story.parseData();
                await story.loadChapters();
                res = await dao.insertStory(story);
                counts = (await Promise.all([
                    dao.knex(TABLES.STORY).count(STORY_FIELDS.ID),
                    dao.knex(TABLES.CHAPTER).count(CHAPTER_FIELDS.ID),
                    dao.knex('fandom').count('id'),
                    dao.knex('story_fandom').count('id')
                ])).map(countRes => Number.parseInt(countRes[0].count));
                select = await dao.knex.select(CHAPTER_FIELDS.TEXT).from(TABLES.CHAPTER).innerJoin(TABLES.STORY, 
                    `${TABLES.STORY}.${STORY_FIELDS.ID}`, '=', `${TABLES.CHAPTER}.${CHAPTER_FIELDS.STORY_ID}`);

            } catch (err) {
                expect(err).to.be.null;
            }           
            expect(counts).to.eql([1, story.content.length, story.fandoms.length, story.fandoms.length]);
            expect(select).to.have.length(story.content.length);
            expect(res).to.have.property('authorRes');
            expect(res).to.have.property('storyId');
            expect(res).to.have.property('chapterIds');
            expect(res).to.have.property('fandomsRes');
            expect(res).to.have.property('storyToFandomIds');            
        });

    }); 

});
