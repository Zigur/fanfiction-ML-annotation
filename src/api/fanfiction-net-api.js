const axios = require('axios');
const cheerio = require('cheerio');

// REGEX MATCHES

// STORY REGEX
const _STORYID_REGEX = /var\s+storyid\s*=\s*(\d+);/;
const _CHAPTER_REGEX = /var\s+chapter\s*=\s*(\d+);/
const _CHAPTERS_REGEX = /Chapters:\s*(\d+)\s*/;
const _WORDS_REGEX = /Words:\s*([\d,]+)\s*/;
const _TITLE_REGEX = /var\s+title\s*=\s*'(.+)';/;
const _DATEP_REGEX = /Published:\s*<span.+?='(\d+)'>/;
const _DATEU_REGEX = /Updated:\s*<span.+?='(\d+)'>/;

// USER REGEX
const _USERID_REGEX = /var\s+userid\s*=\s*(\d+);/;
const _AUTHOR_REGEX = /href='\/u\/\d+\/(.+?)'/;
const _USERID_URL_EXTRACT = /.*\/u\/(\d+)/;
const _USERNAME_REGEX = /<link rel=\"canonical\" href=\"\/\/www.fanfiction.net\/u\/\d+\/(.+)\">/;
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
const _GENRES = [
    'General', 'Romance', 'Humor', 'Drama', 'Poetry', 'Adventure', 'Mystery',
    'Horror', 'Parody', 'Angst', 'Supernatural', 'Suspense', 'Sci-Fi',
    'Fantasy', 'Spiritual', 'Tragedy', 'Western', 'Crime', 'Family', 'Hurt',
    'Comfort', 'Friendship'
];

// TEMPLATES
const _FANFICTION_BASE_URL = 'https://www.fanfiction.net';
// const _CHAPTER_URL_TEMPLATE = 'https://www.fanfiction.net/s/';
// const _USERID_BASE_URL_ = 'https://www.fanfiction.net/u';

const _DATE_COMPARISON = new Date(1970, 1, 1);

// function parseString()

function parseInteger() {

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
            fandoms [str]:           The fandoms to which the story belongs
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
        }
        else if (typeof id === 'string') {
            id = 1;
        }
        else {
            this.id = id;
        }
        this.fetchData = this.fetchData.bind(this);

    }

    async fetchData() {
        console.log('Story.fetchData - trying to fetch data');
        try {
            const res = await axios({
                method: 'GET',
                url: `${_FANFICTION_BASE_URL}/s/${this.id}`,
                responseType: 'text/html',
                'accept-encoding': 'gzip, deflate, br',
                transformResponse: [data => data]
            });
            console.log(`Story.fetchData - done. Response is ${res}`);
            if (res.status === 200) {
                const source = res.data;
                console.log(`Source is: ${source}`);
                const $ = cheerio.load(source);
                const title = $('#profile_top > b.xcontrast_txt').text();
                console.log(`Title is ${title}`);
                return {
                    title
                };
            } else {
                throw new Error(`Received status ${res.status}`);
            }
        }
        catch (err) {
            console.log(err);
        }
    }

}

module.exports = {
    Story: Story
};