const express = require ('express');
const dbConnect = require('./database/index');
const {PORT} = require('./config/index');
const router = require('./routes/index');
const errorHandler =require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');


const app = express();
app.use(cookieParser());
app.use(express.json()); // parse incoming requests with json payloads
app.use(router);

dbConnect();

app.use('/storage', express.static('storage'));

app.use(errorHandler);

// Start the server on port PORT

app.get('/', (req, res) => res.json({msg:"hello Muheeb"}));
app.listen(PORT, console.log(`backend is running on port  :${PORT}`));