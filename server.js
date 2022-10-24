const express = require('express');
const db = require('./config/connection');
const routes = require('./routes');
const cors = require("cors");


console.log("hi from server")

const PORT = process.env.PORT || 3001;
const app = express();

// // LOCAL
app.use(cors());

// DEPLOYED
// app.use(cors({
//   origin:"https://browser-party.herokuapp.com" // change
// }))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(routes);

db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
  });
});
