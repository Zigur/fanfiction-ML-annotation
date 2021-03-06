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

    describe('createTables(), dropTables() and hasTables()', function() {
        it('successfully creates the tables and drops them', async function() {

            let exist = await dao.hasTables();
            expect(exist).to.be.false;
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
            exist = await dao.hasTables();
            expect(exist).to.be.true;
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
            exist = await dao.hasTables();
            expect(exist).to.be.false;  

        });
    });
    
    /*
    describe('hasTables', function() {

        it('checks that there are no tables', async function() {
            const flag = await dao.hasTables();
            expect(flag).to.be.false;
        });

        it('checks that there are tables after creation', async function() {
            await dao.createTables();3
            const flag = await dao.hasTables();
            expect(flag).to.be.false;
            await dao.dropTables();
        });

    }); */ 

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
            console.log('insertStory() - insert a story with a few chapters: begins...');
            const { TABLES, STORY_FIELDS, CHAPTER_FIELDS } = CONSTANTS;
            const story = new Story(12);
            let res, counts, select;
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
            expect(counts).to.eql([1, story.content.length, story.fandoms.length, story.fandoms.length]);
            expect(select).to.have.length(story.content.length);
            expect(res).to.have.property('authorRes');
            expect(res).to.have.property('storyId');
            expect(res).to.have.property('chapterIds');
            expect(res).to.have.property('fandomsRes');
            expect(res).to.have.property('storyToFandomIds'); 
            console.log('insertStory() - insert a story with a few chapters: done...');          
        });

        it('inserts a story whose author already exists', async function() {
            console.log('insertStory() - inserts a story whose author already exists: begins...');
            const { TABLES, STORY_FIELDS, CHAPTER_FIELDS, AUTHOR_FIELDS } = CONSTANTS;
            const countsBefore = (await Promise.all([
                dao.knex(TABLES.STORY).count(STORY_FIELDS.ID),
                dao.knex(TABLES.CHAPTER).count(CHAPTER_FIELDS.ID),
                dao.knex(TABLES.AUTHOR).count(AUTHOR_FIELDS.ID)
            ])).map(countRes => Number.parseInt(countRes[0].count));
            const story = new Story(2270);
            await story.fetchData();
            story.parseData();
            await story.loadChapters();
            await dao.insertStory(story);
            const countsAfter = (await Promise.all([
                dao.knex(TABLES.STORY).count(STORY_FIELDS.ID),
                dao.knex(TABLES.CHAPTER).count(CHAPTER_FIELDS.ID),
                dao.knex(TABLES.AUTHOR).count(AUTHOR_FIELDS.ID)
            ])).map(countRes => Number.parseInt(countRes[0].count));
            expect(countsAfter[0] - countsBefore[0]).to.equal(1);
            expect(countsAfter[1] - countsBefore[1]).to.equal(story.content.length); // FIXME chapters cannot be 0!!
            expect(countsAfter[2] - countsBefore[2]).to.equal(0);
            const select = await dao.knex.select(STORY_FIELDS.AUTHOR_ID).from(TABLES.STORY);
            console.log(select);
            console.log('insertStory() - inserts a story whose author already exists: done...');
        });

    }); 

});
