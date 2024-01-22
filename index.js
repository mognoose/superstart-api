let express = require('express');
let fs = require("fs/promises");
let formidable = require('formidable');
let cors = require('cors');
let app = express();
app.use(cors());

const PORT = 8080;

async function getGames() {
    try {
        return await fs.readdir(`${__dirname}/games`)
    } catch (err) {
        console.error('Error occurred while reading directory:', err)
    }
}

async function getMetadata(game) {
    try {
        const files = await fs.readdir(`${__dirname}/games/${game}`);
        let metadata = files.includes('metadata') ? JSON.parse(await fs.readFile(`${__dirname}/games/${game}/metadata`, 'utf8', (err, metadata) => metadata )): {}
        return {
            name: metadata.name || game,
            files,
            metadata
        }
    } catch (err) {
        console.error('Error occurred while reading directory:', err)
    }
}

app.get('/api/games', async function(req, res) {
    const gamesFolder = await getGames();
    const games = [];
    for (let i = 0; i < gamesFolder.length; i++) {
        games.push(await getMetadata(gamesFolder[i]));
    }

    res.json(games);

});

app.get('/api/uploadform', async function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();

});

app.post('/api/fileupload', async function(req, res) {
        try {
            const uploadDir = `${__dirname}/games`;
            const customOptions = {
                uploadDir: `${__dirname}/games`,
                keepExtensions: true,
                allowEmptyFiles: false,
                maxFileSize: 5 * 1024 * 1024 * 1024,
                multiples: true,
            };

            const form = new formidable.IncomingForm();
            
            form.parse(req, (err, fields, files) => {
                console.log(files)
            if (err) throw err;
    
            if (!files.filetoupload) return res.status(400).json({ message: 'No file Selected' });
            files.filetoupload.forEach((file) => {
                const newFilepath = `${uploadDir}/${file.originalFilename}`;
                fs.rename(file.filepath, newFilepath, err => err);
            });
            return res.status(200).json({ message: ' File Uploaded ' });
    
    
            });
    
        }
        catch (err) {
            res.status(400).json({ message: 'Error occured', error: err });
        }

});

app.listen(PORT, function(req, res) { 
    console.log(`Server is running at port ${PORT}`);
}); 
