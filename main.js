const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const app = express();

app.use(express.static('./static'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 80;
const LOG_PATH = './logs';

async function genImage(width, height, ip) {
    const overlay = `
        <svg width="${width}" height="${height}">
            <text x="50%"
                  y="60%"
                  text-anchor="middle"
                  font-family="Calibri"
                  font-weight="bold"
                  font-size="128">${ip}</text>    
        </svg>
    `;

    return await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 1
            }
        }
    })
        .composite([
            {
                input: Buffer.from(overlay),
                gravity: 'center'
            }
        ])
        .png()
        .toBuffer();
}

if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH);

app.get('/', (req, res) => {
    res.render('how-to');
});

app.get('/:id', (req, res) => {
    const ip = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0]
        : req.connection.remoteAddress;

    res.render('index', { ip, id: req.params.id });
});

app.get('/:id/ip', async (req, res) => {
    const ip = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0]
        : req.connection.remoteAddress;

    // We need to do the logging here since the image is requested by the client
    // while the HTML page isn't
    fs.appendFile(`${LOG_PATH}/${req.params.id}.txt`, `${ip}\n`, () => {});

    const image = await genImage(1000, 400, ip);
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(image);
});

app.get('/:id/raw', async (req, res) => {
    const logFile = `${LOG_PATH}/${req.params.id}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    fs.readFile(logFile, (err, logs) => {
        if (err) {
            res.status(404).end();
            return;
        }

        res.status(200).send(logs);
    });
});

app.get('/:id/logs', async (req, res) => {
    res.render('logs', { id: req.params.id });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
