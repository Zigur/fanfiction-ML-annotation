const http = require('http');
const Story = require('./api/fanfiction-net-api').Story;

const hostname = '127.0.0.1';
const port = '3000';

const server = http.createServer((req, res) => {
    const story = new Story(12);
    return story.fetchData().then(payload => {
        console.log(payload);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
    }).catch(err => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`INTERNAL SERVER ERROR: ${JSON.stringify(err)}`);
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})