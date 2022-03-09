const router = require('express').Router();
const apiRoutes = require('./api');
const homeroutes = require('./homeroutes');

router.use('/api', apiRoutes);
router.use('/', homeroutes);


router.use((req, res) => res.send('Wrong route!'));

module.exports = router;
