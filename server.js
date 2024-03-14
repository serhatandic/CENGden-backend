require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const { ObjectId } = require('mongodb'); // at the top of your file

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
app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello World');
});

// user routes
app.post('/api/users/register', () => {});
app.post('/api/users/login', () => {});
app.get('/api/users/profile', () => {});
app.put('/api/users/profile', () => {});
app.delete('/api/users/:userId', () => {});

// item routes
app.post('/api/items', (req, res) => {
	try {
		const database = client.db('CENGden');
		const items = database.collection('Items');
		// insert 100 times
		const result = items.insertOne(req.body);
		res.send(result + ' added');
	} catch (error) {
		console.log(error);
	}
});
app.get('/api/items', async (req, res) => {
	try {
		// list from recent to old
		const database = client.db('CENGden');
		const items = database.collection('Items');
		const query = { Status: 'active' };
		const results = await items
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();

		res.send(results);
	} catch (error) {}
});
app.get('/api/items/user/:userId', async (req, res) => {
	const userId = req.params.userId;
	const database = client.db('CENGden');
	const items = database.collection('Items');
	const query = { Owner: userId };
	const results = await items.find(query).sort({ createdAt: -1 }).toArray();
	res.send(results);
});
app.get('/api/items/:category', async (req, res) => {
	const category = req.params.category;
	const database = client.db('CENGden');
	const items = database.collection('Items');
	const query = { Category: category, Status: 'active' };
	const results = await items.find(query).sort({ createdAt: -1 }).toArray();
	res.send(results);
});
app.get('/api/item/:itemId', async (req, res) => {
	// get item details
	const id = req.params.itemId;
	const database = client.db('CENGden');
	const items = database.collection('Items');
	const query = { _id: new ObjectId(id) };
	const result = await items.findOne(query);
	res.send(result);
});
app.get('/api/items/user/:userId/favorites', async (req, res) => {
	// get user's favorite items
	const userId = req.params.userId;
	const database = client.db('CENGden');
	const favorites = database.collection('UserFavorites');
	const query = { UserId: userId };
	const userFavorites = await favorites.findOne(query);
	if (!userFavorites) {
		res.send([]);
		return;
	}
	res.send(userFavorites.Favorites);
});
app.put('/api/items/user/:userId/favorites/:itemId', async (req, res) => {
	// add item to user's favorites
	const userId = req.params.userId;
	const itemId = req.params.itemId;
	const database = client.db('CENGden');
	const favorites = database.collection('UserFavorites');
	const query = { UserId: userId };
	// if user does not have a favorites array, create one
	const userFavorites = await favorites.findOne(query);
	if (!userFavorites) {
		await favorites.insertOne({ UserId: userId, Favorites: [itemId] });
		res.send('Item added to favorites');
		return;
	}
	const update = { $push: { Favorites: itemId } };
	await favorites.updateOne(query, update);
	res.send('Item added to favorites');
});
app.delete('/api/items/user/:userId/favorites/:itemId', async (req, res) => {
	// remove item from user's favorites
	const userId = req.params.userId;
	const itemId = req.params.itemId;
	const database = client.db('CENGden');
	const favorites = database.collection('UserFavorites');
	const query = { UserId: userId };
	// update favorites array
	const update = { $pull: { Favorites: itemId } };
	await favorites.updateOne(query, update);
	res.send('Item removed from favorites');
});
app.put('/api/item/:itemId', async (req, res) => {
	const id = req.params.itemId;
	const database = client.db('CENGden');
	const items = database.collection('Items');
	const query = { _id: new ObjectId(id) };
	delete req.body._id;
	const update = { $set: req.body };
	await items.updateOne(query, update);
	res.send('Item updated');
});
app.delete('/api/item/:itemId', async (req, res) => {
	const id = req.params.itemId;
	const database = client.db('CENGden');
	const items = database.collection('Items');
	const query = { _id: new ObjectId(id) };
	await items.deleteOne(query);
	res.send('Item deleted');
});
app.delete('/api/items', async (req, res) => {
	const database = client.db('CENGden');
	const items = database.collection('Items');
	await items.deleteMany({});
	res.send('All items deleted');
});
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
