const http = require('http');
const Story = require('./src/api/fanfiction-net-api').Story;

const hostname = '127.0.0.1';
const port = '3000';

const server = http.createServer(async(req, res) => {
    const story = new Story(12);
    try {
        await story.fetchData();
        story.parseData();
        await story.loadChapters();
        const payload = story.toJSON();
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(payload);
    } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`INTERNAL SERVER ERROR: ${err.message}`);
    };
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
