require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const { ObjectId } = require('mongodb'); // at the top of your file
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(
	'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'
);

const URI = process.env.MONGODB_URI;
const client = new MongoClient(URI, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const app = express();
app.use(
	express.json({
		limit: '50mb',
	})
);
app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.post('/api/items', (req, res) => {
	try {
		const database = client.db('CENGden');
		const items = database.collection('Items');
		const result = items.insertOne(req.body);
		res.send(result + ' added');
	} catch (error) {
		console.error(error);
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
	res.json({ result: result });
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
app.put('/api/items/:itemId/user/:userId/favorites', async (req, res) => {
	// add user to item's favoritedBy
	const userId = req.params.userId;
	const itemId = req.params.itemId;
	const database = client.db('CENGden');
	const favoritedBy = database.collection('FavoritedBy');
	const query = { ItemId: itemId };
	// if item does not have a favoritedBy array, create one
	const itemFavoritedBy = await favoritedBy.findOne(query);
	if (!itemFavoritedBy) {
		await favoritedBy.insertOne({ ItemId: itemId, FavoritedBy: [userId] });
		res.send('User added to favoritedBy');
		return;
	}
	const update = { $push: { FavoritedBy: userId } };
	await favoritedBy.updateOne(query, update);
	res.send('User added to favoritedBy');
});
app.delete('/api/items/:itemId/user/:userId/favorites', async (req, res) => {
	// remove user from item's favoritedBy
	const userId = req.params.userId;
	const itemId = req.params.itemId;
	const database = client.db('CENGden');
	const favoritedBy = database.collection('FavoritedBy');
	const query = { ItemId: itemId };
	const update = { $pull: { FavoritedBy: userId } };
	await favoritedBy.updateOne(query, update);
	res.send('User removed from favoritedBy');
});
app.get('/api/items/:itemId/favoritedBy', async (req, res) => {
	// get users who favorited an item
	const itemId = req.params.itemId;
	const database = client.db('CENGden');
	const favoritedBy = database.collection('FavoritedBy');
	const query = { ItemId: itemId };
	const result = await favoritedBy.findOne(query);
	if (!result) {
		res.send([]);
		return;
	}
	res.send(result.FavoritedBy);
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

app.post('/api/sendmail/:to/:itemTitle', async (req, res) => {
	const to = req.params.to;
	const itemTitle = req.params.itemTitle;

	const msg = {
		to: to,
		from: 'serhat.andic@ceng.metu.edu.tr',
		subject: 'price drop',
		text: `The price of ${itemTitle} has dropped!`,
		html: `<strong>The price of ${itemTitle} has dropped!</strong>`,
	};

	try {
		await sgMail.send(msg);
		res.send('Email sent');
	} catch (error) {
		console.error(error);
	}
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
