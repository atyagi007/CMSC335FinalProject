require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

const uri = "mongodb+srv://cmakkar:335finalChetIsGoat@cluster0.pfr8c.mongodb.net/finalProject335kabAnshChet?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

connectDB();


async function fetchExaData(query) {
    const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXA_API_KEY
        },
        body: JSON.stringify({
            query: query,
            numResults: 5,
            useAutoprompt: true,
            contents: {
                text: {
                    maxCharacters: 2000,
                    includeHtmlTags: false
                },
                highlights: {
                    numSentences: 3,
                    highlightsPerUrl: 1,
                    query: query
                },
                summary: {
                    query: query
                }
            }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
}

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/search", async (req, res) => {
    try {
        const { city, category } = req.body;
        const query = `Hidden ${category} in ${city}`;
        const results = await fetchExaData(query);

        const resultsWithIds = results.map(r => {
            const id = Math.random().toString(36).substring(2, 9);
            return { id, ...r };
        });

        res.render('search', { results: resultsWithIds, city, category });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.post("/save", async (req, res) => {
    const { name, address } = req.body;
    try {
        const collection = client.db("hiddenGems").collection("favorites");
        await collection.insertOne({ name, address });
        res.render("confirmation", { name });
    } catch (error) {
        console.error('Error saving favorite:', error);
        res.status(500).send('Error saving favorite');
    }
});

app.get("/favorites", async (req, res) => {
    try {
        const collection = client.db("hiddenGems").collection("favorites");
        const favorites = await collection.find({}).toArray();
        res.render("favorites", { favorites });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).send('Error fetching favorites');
    }
});

app.post("/reset", async (req, res) => {
    try {
        const collection = client.db("hiddenGems").collection("favorites");
        await collection.deleteMany({});
        res.redirect("/favorites");
    } catch (error) {
        console.error('Error resetting favorites:', error);
        res.status(500).send('Error resetting favorites');
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

//debugging log statements added, as mongo was giving us some trouble - own ref comment
console.log('MongoDB Username:', process.env.MONGO_DB_USERNAME);
console.log('MongoDB Password:', process.env.MONGO_DB_PASSWORD);
console.log('MongoDB Name:', process.env.MONGO_DB_NAME);
