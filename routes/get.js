const express = require('express');
const router = express.Router();
const axios = require('axios');
const beautify_html = require('js-beautify').html;
const cheerio = require('cheerio');

/* GET home page. */
router.post('/per-chapter', async (req, res, next) => {
	// TODO :
	// 	get url from req.body
	// const url = 'https://mangakomi.com/manga/versatile-mage';
	// const chapter = 283;

	const {url, chapter} = req.body;

	if (!url || !chapter) {
		return res.json({
			success: false,
			message: "url and chapter must fill"
		});
	}

	let URL = url + '/chapter-' + chapter;
	
	const options = {
    	headers: {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'}
  	};

  	try {

  		const response = await axios.get(URL, options);
	    if (response.status != 200) {
	      return res.send('err');
	    }

	    //const result = beautify_html(response.data).replace(/(\r\n|\n|\r|)/gm, "");
    	let $ = cheerio.load(response.data);

    	let data = {};
    	data.title = $('h1').text();
    	data.source = []

    	$('.reading-content .page-break').each((index, element) => {
    		data.source[index] = {}
    		data.source[index]['src'] = $(element).find('.wp-manga-chapter-img').data('lazySrc');
    	})

	    return res.json({
	    	success: true,
	    	data: data
	    })

  	} catch(err) {
  		return res.json({
			success: false,
			message: "check url again"
		});
  	}
});

router.get('/show', function(req, res, next) {
  res.json({
  	success: true,
  	data: []
  })
});

module.exports = router;
