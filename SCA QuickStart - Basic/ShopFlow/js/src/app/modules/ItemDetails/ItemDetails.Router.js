/* global nsglobal */
// ItemDetails.Router.js
// ---------------------
// Adds route listener to display Product Detailed Page
// Parses any options pased as parameters
define('ItemDetails.Router', [], function ()
{
	'use strict';

	return Backbone.Router.extend({

		routes: {
			':url': 'productDetailsByUrl'
		,	'imagegallery/:key': 'imageGallery'
		}

	,	initialize: function (options)
		{
			this.application = options.application;
			// we will also add a new regexp route to this, that will cover any url with slashes in it so in the case
			// you want to handle urls like /cat1/cat2/urlcomponent, as this are the last routes to be evaluated,
			// it will only get here if there is no other more apropiate one
			this.route(/^(.*?)$/, 'productDetailsByUrl');
			this.Model = options.model;
			this.View = options.view;

			// This is the fallback url if a product does not have a url component.
			this.route('product/:id', 'productDetailsById');
			this.route('product/:id?:options', 'productDetailsById');
			this.route('product/:id/:options', 'productDetailsById');
		}

	,	imageGallery: function(key){

		}

	,	productDetailsByUrl: function (url)
		{
			if (!url)
			{
				return;
			}

			// if there are any options in the URL
			var options = null;

			if (~url.indexOf('?'))
			{
				options = SC.Utils.parseUrlOptions(url);
				url = url.split('?')[0];
			}
			// Now go grab the data and show it
			if (options)
			{
				this.productDetails({url: url}, url, options);
			}
			else
			{
				this.productDetails({url: url}, url);
			}
		}

	,	productDetailsById: function (id, options)
		{
			var self= this;

			if(options){
				if (options.indexOf("|") > -1) {
					var optionvals = options.split("client=")[1].split("|");
						this.client = optionvals[0];
						this.pl = optionvals[1];
						this.pli = optionvals[2];
						this.producttype = optionvals[3];
				} else {
						this.client = options.split("client=")[1].split("&")[0];
				}
			}
			var param = new Object();
			var tailor = SC.Application('Shopping').getUser().get('parent')!=null? SC.Application('Shopping').getUser().get('parent'):SC.Application('Shopping').getUser().id;
			param.type = "get_client";
			param.data = JSON.stringify({filters: ["internalid||anyof|integer|" + this.client,'custrecord_tc_tailor||is|integer|'+tailor], columns: ["internalid", "custrecord_tc_first_name", "custrecord_tc_last_name", "custrecord_tc_email", "custrecord_tc_addr1", "custrecord_tc_addr2", "custrecord_tc_country", "custrecord_tc_city", "custrecord_tc_state", "custrecord_tc_zip", "custrecord_tc_phone"]});

			jQuery.get(_.getAbsoluteUrl('services/fitprofile.ss'), param).always(function(data){
				if(data[0]){
					// Now go grab the data and show it
					if(options){
						if(options.indexOf("|") > -1){
							self.productDetails({id: id}, '/product/'+id,  SC.Utils.parseUrlOptions(options), options.split("?")[0]);
						} else {
							self.productDetails({id: id}, '/product/'+id, SC.Utils.parseUrlOptions(options));
						}
					}
				}
				else{
					window.location.href= "http://store.jeromeclothiers.com";
				}
			});

		}

	,	productDetails: function (api_query, base_url, options, plist)
		{
			// Decodes url options
			_.each(options, function (value, name)
			{
				options[name] = decodeURIComponent(value);
			});

			var application = this.application
			,	model = new this.Model()
				// we create a new instance of the ProductDetailed View
			,	view = new this.View({
					model: model
				,	baseUrl: base_url
				,	application: this.application
				,	pList: plist
				});
			model.fetch({
				data: api_query
			,	killerId: this.application.killerId
			}).then(
				// Success function
				function ()
				{
					if (!model.isNew())
					{
						if (api_query.id && model.get('urlcomponent') && SC.ENVIRONMENT.jsEnvironment === 'server')
						{
							nsglobal.statusCode = 301;
							nsglobal.location = model.get('_url');
						}

						// once the item is fully loadede we set its options
						model.parseQueryStringOptions(options);

						if (!(options && options.quantity))
						{
							model.set('quantity', model.get('_minimumQuantity'));
						}
						if(options && options['product']){
							if(options['product'] == '2-Piece-Suit'){
									model.set('custitem_clothing_type','Jacket, Trouser');
									model.setOption('custcol_producttype',options['product']);
							}else if(options['product'] == '3-Piece-Suit'){
									model.set('custitem_clothing_type','Jacket, Trouser, Waistcoat');
									model.setOption('custcol_producttype',options['product']);
							}else{
								model.set('custitem_clothing_type',options['product']);
								model.setOption('custcol_producttype',options['product']);
							}
						}else{
							if(plist.split('|')[3] == '2-Piece-Suit'){
									model.set('custitem_clothing_type','Jacket, Trouser');
									model.setOption('custcol_producttype',plist.split('|')[3]);
							}else if(plist.split('|')[3] == '3-Piece-Suit'){
									model.set('custitem_clothing_type','Jacket, Trouser, Waistcoat');
									model.setOption('custcol_producttype',plist.split('|')[3]);
							}else{
								model.set('custitem_clothing_type',plist.split('|')[3]);
								model.setOption('custcol_producttype',plist.split('|')[3]);
							}
						}
						// we first prepare the view
						view.prepView();
						_.suiteRest('getVendorLink', model.get('internalid')).always(function (data) {
                if (data) {
                    window.vendor = data;
                }
								// then we show the content
								view.showContent();
            });

					}
					else
					{
						// We just show the 404 page
						application.getLayout().notFound();
					}
				}
				// Error function
			,	function (model, jqXhr)
				{
					// this will stop the ErrorManagment module to process this error
					// as we are taking care of it
					jqXhr.preventDefault = true;

					// We just show the 404 page
					application.getLayout().notFound();
				}
			);
		}
	});
});
