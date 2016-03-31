module.exports.name = 'index';
module.exports.controller = function(router, app) {
	//index
	router.route('/')
		.get(function (req, res) {
			console.log('[log] : GET /');
			res.render('index.hbs');
		});
}