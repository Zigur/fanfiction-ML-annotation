const http = require('http');
const Story = require('./src/api/fanfiction-net-api').Story;

const hostname = '127.0.0.1';
const port = '3000';

const server = http.createServer(async (req, res) => {
    const story = new Story(12);
    try {
        await story.fetchData();
        const storyData = story.parseData();
        const payload = JSON.stringify(storyData);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(payload);
    }
    catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`INTERNAL SERVER ERROR: ${err.message}`);
    };
    /*
    return story.fetchData().then(payload => {
        console.log(payload);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
    }).catch(err => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`INTERNAL SERVER ERROR: ${JSON.stringify(err)}`);
    });*/
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})