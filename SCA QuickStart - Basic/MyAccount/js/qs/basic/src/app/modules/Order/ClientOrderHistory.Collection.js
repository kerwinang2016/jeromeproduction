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
			this.url += "?clientName=" + search;
		}
	});
});