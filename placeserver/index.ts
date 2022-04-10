import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
const port = 2000

function createId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.use(bodyParser.json())

app.get('/status', (req, res) => {
    res.json({
        status: 'ok'
    });
});

app.get('/backup', (req, res) => {
    fs.readFile('./backup.json', 'utf8', (err, data) => {
        if (err) {
            res.json({
                status: 'error',
                message: err
            });
        } else {
            res.json({
                status: 'ok',
                pixels: JSON.parse(data).pixels
            });
        }
    });
});

app.post('/createbackup', (req, res) => {
    console.log(req.body)
    if(fs.existsSync('./backup.json')) {
        const id = createId(5);
        fs.rename('./backup.json', `./backups/${id}.json`, (err) => {
            if(err) {
                console.log(err)
            }
        })
    }
    setTimeout(() => {
        fs.writeFileSync('./backup.json', JSON.stringify(req.body))
    }, 1000);

    res.json({
        status: 'ok'
    });
});

app.listen(port)
console.log(`listening on ${port}`)