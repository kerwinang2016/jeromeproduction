// ProductLists.Model.js
// -----------------------
// Model for handling Product Lists (CRUD)
define('StockList.Model', function ()
{
	'use strict';

	return Backbone.Model.extend(
	{
		urlRoot: _.getAbsoluteUrl('services/stock-list.ss')

	,	validation:
		{
		}

		// redefine url to avoid possible cache problems from browser
	,	url: function()
		{
			var base_url = Backbone.Model.prototype.url.apply(this, arguments);

			return base_url + '&t=' + new Date().getTime();
		}

	,	initialize: function (data)
		{
		}


	});

});
