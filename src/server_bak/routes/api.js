const express = require('express');
const codeController = require('../controllers/code');
const codeSetController = require('../controllers/codeSet');
const terminologyController = require('../controllers/terminology');

const router = express.Router();

router.post('/code/search', codeController.searchMultiple); // /

router.post('/code/enhance', codeController.enhance);
router.post('/code/unmatchedChildren', codeController.unmatchedChildren); // /
router.get('/code/freq/:term', codeController.freq);
router.post('/code/freqMult', codeController.freqMult);

router.post('/save/to/github', codeSetController.create);

router.get('/codesetlist', codeSetController.search);

router.get('/codeset/:id', codeSetController.get);
router.delete('/codeset/:id', codeSetController.delete);

router.get('/terminologies', terminologyController.getTerminologies);

module.exports = router;
