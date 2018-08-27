const util = require('util');

const request = require('request');
const cheerio = require('cheerio');
const stdlib = require('@stdlib/stdlib');

const requestAsync = util.promisify(request);

// REGEX MATCHES

// STORY REGEX
const _STORYID_REGEX = /var\s+storyid\s*=\s*(\d+);/;
const _CHAPTER_REGEX = /var\s+chapter\s*=\s*(\d+);/
const _CHAPTERS_REGEX = /Chapters:\s*(\d+)\s*/;
const _WORDS_REGEX = /Words:\s*([\d,]+)\s*/;
const _FAVS_REGEX = /Favs:\s*([\d,]+)\s*/;
const _TITLE_REGEX = /var\s+title\s*=\s*'(.+)';/;
const _DATEP_REGEX = /Published:\s*<span.+?='(\d+)'>/;
const _DATEU_REGEX = /Updated:\s*<span.+?='(\d+)'>/;

// USER REGEX
const _USERID_REGEX = /var\s+userid\s*=\s*(\d+);/;
const _AUTHOR_REGEX = /href='\/u\/\d+\/(.+?)'/;
const _USERID_URL_EXTRACT = /.*\/u\/(\d+)/;
const _USERNAME_REGEX = /<link rel="canonical" href="\/\/www.fanfiction.net\/u\/\d+\/(.+)">/;
const _USER_STORY_COUNT_REGEX = /My Stories\s*<span class=badge>(\d+)</;
const _USER_FAVOURITE_COUNT_REGEX = /Favorite Stories\s*<span class=badge>(\d+)</;
const _USER_FAVOURITE_AUTHOR_COUNT_REGEX = /Favorite Authors\s*<span class=badge>(\d+)</;

// Useful for generating a review URL later on
const _STORYTEXTID_REGEX = /var\s+storytextid\s*=\s*storytextid=(\d+);/;

// REGEX that used to parse reviews page
const _REVIEW_COMPLETE_INFO_REGEX = /img class=.*?<\/div/;
const _REVIEW_USER_NAME_REGEX = /> *([^< ][^<]*)</;
const _REVIEW_CHAPTER_REGEX = /<small style=[^>]*>([^<]*)</;
const _REVIEW_TIME_REGEX = /<span data[^>]*>([^<]*)</;
const _REVIEW_TEXT_REGEX = /<div[^>]*>([^<]*)</;

// Used to parse the attributes which aren't directly contained in the
// JavaScript and hence need to be parsed manually
const _NON_JAVASCRIPT_REGEX = /Rated:(.+?)<\/div>/;
const _HTML_TAG_REGEX = /<.*?>/;

// Needed to properly decide if a token contains a genre or a character name
const _GENRES = new Set([
    'General', 'Romance', 'Humor', 'Drama', 'Poetry', 'Adventure', 'Mystery',
    'Horror', 'Parody', 'Angst', 'Supernatural', 'Suspense', 'Sci-Fi',
    'Fantasy', 'Spiritual', 'Tragedy', 'Western', 'Crime', 'Family', 'Hurt',
    'Comfort', 'Friendship'
]);

const TABLES = {
    STORY: 'story',
    CHAPTER: 'chapter'
}

const STORY_FIELDS = {
    ID: 'id',
    // FANFICTION_NET_ID: 'fanfiction_net_id',
    TITLE: 'title',
    SYNOPSIS: 'synopsis',
    RATING: 'rating',
    LANGUAGE: 'language',
    GENRES: 'genres',
    AUTHOR_ID: 'author_id',
    WORDS: 'words',
    CHAPTERS: 'chapters',
    REVIEWS: 'reviews',
    FAVS: 'favs',
    FOLLOWERS: 'followers',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at'
};

const CHAPTER_FIELDS = {
    ID: 'id',
    STORY_ID: 'story_id',
    NUMBER: 'number',
    TEXT: 'text'
};

// TEMPLATES
const _FANFICTION_BASE_URL = 'https://www.fanfiction.net';
// const _CHAPTER_URL_TEMPLATE = 'https://www.fanfiction.net/s/';
// const _USERID_BASE_URL_ = 'https://www.fanfiction.net/u';

const _DATE_COMPARISON = new Date(1970, 1, 1);

const _HTTP_SUCCESS = 200;
// function parseString()

function convertParamToInteger(tokens, substr) {
    const tested = tokens.find(token => token.includes(substr));
    return tested ? Number.parseInt(tested.replace(substr, '').trim().replace(',', '')) : 0;
}

function intersect(setA, setB) {
    const intersection = new Set();
    for (const elem of setB) {
        if (setA.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

/**
 * @class
 * @name Story
 * @description A story on fanfiction.net
        If both url, and id are provided, url is used.
        :type id: int
                Attributes:
            id  (int):              The story id.
            timestamp:              The timestamp of moment when data was consistent with site
            fandoms [str]:          The fandoms to which the story belongs
            chapter_count (int);    The number of chapters.
            word_count (int):       The number of words.
            author_id (int):        The user id of the author.
            title (str):            The title of the story.
            date_published (date):  The date the story was published.
            date_updated (date):    The date of the most recent update.
            rated (str):            The story rating.
            language (str):         The story language.
            genre [str]:            The genre(s) of the story.
            characters [str]:       The character(s) of the story.
            reviews (int):          The number of reviews of the story.
            favs (int):             The number of user which has this story in favorite list
            followers (int):        The number of users who follow the story
            complete (bool):        True if the story is complete, else False.
  * @param{String} url - The url of the story.
  * @param{} id - The story id of the story
 */
class Story {

    constructor(id = 0) {
        if (!id) {
            throw Error('please provide an id or a url');
        } else if (typeof id === 'string') {
            id = 1;
        } else {
            this.id = id;
        }
        this.fetchData = this.fetchData.bind(this);
        this.parseData = this.parseData.bind(this);
        this.content = [];
    }

    async fetchData() {
        console.log('Story.fetchData - trying to fetch data');
        try {
            const res = await requestAsync({
                method: 'GET',
                url: `${_FANFICTION_BASE_URL}/s/${this.id}`
            });
            // console.log(`Story.fetchData - done. Response is ${JSON.stringify(res)}`);
            if (res.statusCode === _HTTP_SUCCESS) {
                this._html = res.body;
                // console.log(`Story.fetchData - page HTML is ${this._html}`);
                
            } else {
                console.log(`Story.fetchData() - Received status: ${res.status}`);
            }
        } catch (err) {
            console.log(err);
        }
    }

    async loadChapters() {
        for (let i = 1; i <= this.chapters; i++) {
            const res = await requestAsync({
                method: 'GET',
                url: `${_FANFICTION_BASE_URL}/s/${this.id}/${i}`
            });
            if (res.statusCode !== _HTTP_SUCCESS) {
                this.content.push({
                    number: i,
                    text: undefined,
                    error: 'chapter failed to load'
                });
            } else {
                const $ = cheerio.load(res.body);
                this.content.push({
                    number: i,
                    text: $('#storytextp').text()
                });
            }
        }
    }

    parseData() {
        if (!this._html) {
            return {};
        }
        const $ = cheerio.load(this._html);
        // const title = $('#profile_top > b.xcontrast_txt').text();
        const preStoryLinks = $('#pre_story_links a');
        this.fandoms = preStoryLinks.map((i, elem) => {
            return {
                url: `${_FANFICTION_BASE_URL}${$(elem).attr('href')}`,
                name: $(elem).text()
            };
        }).get();

        const $storyProfile = $('#profile_top');
        this.title = $storyProfile.find('b').first().text();
        this.synopsis = $storyProfile.children('div').text();
        const $author = $storyProfile.children('a').first(); 
        this.author = { name: $author.text(), url: `${_FANFICTION_BASE_URL}${$author.attr('href')}` };

        const $otherInfo = $storyProfile.children('span').last();
        this.rating = $otherInfo.children('a[target=rating]').text();
        const otherInfo = $otherInfo.text();
        
        // const chaptersCount = otherInfo.match(_CHAPTERS_REGEX) || otherInfo.match(_CHAPTERS_REGEX)[0];
        const tokens = otherInfo.split('-').map(token => token.trim());
        this.language = tokens[1];
        this.genres = [...intersect(new Set(tokens), _GENRES)];
        const numericTokensMap = new Map([
            ['words', 'Words:'],
            ['chapters', 'Chapters:'],
            ['reviews', 'Reviews:'],
            ['favs', 'Favs:'],
            ['followers', 'Follows:']
        ]); 
        
        // const meta = {};
        for (const [key, regex] of numericTokensMap.entries()) {
            this[key] = convertParamToInteger(tokens, regex);
        }
        
    }

    toJSON() {
        return JSON.stringify(stdlib.utils.omit(this, ['_html']));
    }

    store(dbConn) {

    }

}

class DataAccessObject {

    constructor(connection) {
        this.knex = require('knex')({
            client: 'pg',
            connection,
            asyncStackTraces: true
        });
    }

    createTables() {
        const { knex } = this;

        return knex.schema.createTable('author', table => {
            console.log(`DataAccessObject.createTables - author table created: ${table}`);
            table.increments('id');
            table.text('name').index().notNullable();
            table.text('url').index().notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }).createTable('fandom', table => {
            console.log(`DataAccessObject.createTables - fandom table created: ${table}`);
            table.increments('id');
            table.text('name').index().notNullable();
            table.text('url').index().notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }).createTable(TABLES.STORY, table => {
            console.log(`DataAccessObject.createTables - story table created: ${table}`);
            // table.increments(STORY_FIELDS.ID);
            table.bigInteger(STORY_FIELDS.ID).primary();
            table.text(STORY_FIELDS.TITLE).index().notNullable();
            table.text(STORY_FIELDS.SYNOPSIS);
            table.text(STORY_FIELDS.RATING);
            table.text(STORY_FIELDS.LANGUAGE);
            table.specificType(STORY_FIELDS.GENRES, 'text[]');
            table.integer(STORY_FIELDS.AUTHOR_ID).references('id').inTable('author');
            table.integer(STORY_FIELDS.WORDS);
            table.integer(STORY_FIELDS.CHAPTERS);
            table.integer(STORY_FIELDS.REVIEWS);
            table.integer(STORY_FIELDS.FAVS);
            table.integer(STORY_FIELDS.FOLLOWERS);
            table.timestamp(STORY_FIELDS.CREATED_AT).defaultTo(knex.fn.now());
            table.timestamp(STORY_FIELDS.UPDATED_AT).defaultTo(knex.fn.now());
        }).createTable(TABLES.CHAPTER, table => {
            console.log(`DataAccessObject.createTables - chapter table created: ${table}`);
            table.increments(CHAPTER_FIELDS.ID);
            table.integer(CHAPTER_FIELDS.NUMBER).index().notNullable().defaultTo(1);
            table.integer(CHAPTER_FIELDS.STORY_ID).references('id').inTable('story').notNullable().index();
            table.text(CHAPTER_FIELDS.TEXT).notNullable();
            // add further more refined columns??
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }).createTable('story_fandom', table => {
            console.log(`DataAccessObject.createTables - story_fandom table created: ${table}`);
            table.increments('id');
            table.integer('story_id').references('id').inTable('story').notNullable().index();
            table.integer('fandom_id').references('id').inTable('fandom').notNullable().index();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });

    }

    dropTables() {
        return this.knex.schema.dropTableIfExists('story_fandom').dropTableIfExists('chapter')
            .dropTableIfExists('story').dropTableIfExists('fandom').dropTableIfExists('author');
    }

    async insertStory(story) {
        if (!typeof story === Story) {
            throw new Error('Please provide a valid fanfictionML.Story object to be inserted');
        }           
        const { knex } = this;
        try {
            knex.transaction[util.promisify.custom] = () => {
                return new Promise((resolve) => {
                    knex.transaction(resolve);
                });
            };
            const transactionAsync = util.promisify(knex.transaction);
            const tx = await transactionAsync();
            try {
                const insertStatement = await tx.insert({
                    'name': story.author.name,
                    'url': story.author.url
                }).into('author').toString();
                const authorRes = await tx.raw(`${insertStatement} on conflict do nothing returning id`);
                const newStory = {
                    ...Object.assign(stdlib.utils.pick(story, Object.values(STORY_FIELDS)), {
                        'author_id': authorRes.rows[0].id
                    })
                };
                const storyId = Number.parseInt((await tx.insert(newStory).into(TABLES.STORY).returning(STORY_FIELDS.ID))[0]);
                const chapterIds = await tx.insert(story.content.map(chapter => Object.assign(chapter, { story_id: storyId })))
                    .into(TABLES.CHAPTER).returning(CHAPTER_FIELDS.ID);
                const fandomsRes = await tx.raw(`${tx.insert(story.fandoms).into('fandom')} on conflict do nothing returning id`);
                const storyToFandom = fandomsRes.rows.map(fandom => {
                    return {
                        story_id: storyId,
                        fandom_id: Number.parseInt(fandom.id)
                    };
                });
                const storyToFandomIds = await tx.insert(storyToFandom).into('story_fandom').returning('id');
                tx.commit();
                return {
                    authorRes,
                    storyId,
                    chapterIds,
                    fandomsRes,
                    storyToFandomIds
                };
            } catch (e) {
                console.log(`Error caught: ${e}`);
                tx.rollback();
            }
        } catch (err) {
            console.log(`Error caught: ${err}`);
        }
    }

}

module.exports = {
    Story: Story,
    DataAccessObject: DataAccessObject,
    CONSTANTS: {
        TABLES,
        STORY_FIELDS,
        CHAPTER_FIELDS
    }
};
