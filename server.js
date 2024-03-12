require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const URI = process.env.MONGODB_URI;
const client = new MongoClient(URI, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.get('/all', async (req, res) => {
	try {
		const database = client.db('CENGden');
		const items = database.collection('Items');
		const query = {};
		const results = await items.findOne(query);
		res.send(results);
	} catch (error) {}
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
