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

// user routes
app.post('/api/users/register', () => {});
app.post('/api/users/login', () => {});
app.get('/api/users/profile', () => {});
app.put('/api/users/profile', () => {});
app.delete('/api/users/:userId', () => {});

// item routes
app.post('/api/items', () => {});
app.get('/api/items', () => {});
app.get('/api/items/:itemId', () => {});
app.put('/api/items/:itemId', () => {});
app.delete('/api/items/:itemId', () => {});
app.patch('/api/items/:itemId/deactivate', () => {});
app.patch('/api/items/:itemId/reactivate', () => {});

// admin and favorites routes
app.delete('/api/admin/items/:itemId', () => {});
app.post('/api/users/favorites', () => {});
app.delete('/api/users/favorites/:itemId', () => {});
app.get('/api/users/favorites', () => {});
app.get('/api/users/verify/:token', () => {});
app.get('/api/items/category/:categoryName', () => {});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
