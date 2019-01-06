// ClientOrderHistory.Collection.js
// -----------------------
// Placed Orders collection but were not using the cache collection
define('ClientOrderHistory.Collection', ['PlacedOrder.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({
		model: Model
	,	url: 'services/placed-order.ss'
	,	parse: function (response)
		{
			this.totalRecordsFound = response.totalRecordsFound;
			this.recordsPerPage = response.recordsPerPage;

			return response.records;
		}
	,	initialize: function (search)
		{
			var customerid = SC.Application('MyAccount').getUser().get('parent');
			this.url += "?clientName=" + search + "&customerid=" +customerid;
		}
	});
});
