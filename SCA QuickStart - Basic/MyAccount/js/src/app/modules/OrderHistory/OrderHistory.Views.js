// OrderHistory.Views.js
// -----------------------
// Views for order's details
define('OrderHistory.Views', ['ItemDetails.Model', 'TrackingServices'], function (ItemDetailsModel, TrackingServices) {
	'use strict';

	var Views = {};

	// show the tracking information on a popup when a tracking number is clicked
	var showTrakingNumbers = function (e) {
		e.preventDefault();
		e.stopPropagation();

		var $link = this.$(e.target)
			, content = this.$($link.data('content-selector')).html();

		$link.popover({
			content: content + '<a class="close" href="#">&times;</a>'
			, trigger: 'manual'
			, html: true
		}).popover('toggle');

		jQuery(document.body).one('click', '.popover .close', function (e) {
			e.preventDefault();
			$link.popover('hide');
		});
	};

	// view an order's detail
	Views.Details = Backbone.View.extend({
		template: 'order_details'

		, title: _('Order Details').translate()
		, page_header: _('Order Details').translate()
		, attributes: {
			'class': 'OrderDetailsView'
		}

		, events: {
			'click [rel=clickover]': 'showTrakingNumbers'
			, 'click .re-order-all-items': 'reorderAll'
			, 'click [data-re-order-item-link]': 'reorderItem'
			, 'click .returnauthorizations-warning a': 'goToReturns'
			, 'click #returnauthorizations-details-header': 'toggleReturns'
		}

		, showContent: function () {
			var self = this;
			self.shipgroups = {};

			self.model.get('lines').filter(function (line) {
				// Test issue #102
				line.set('quantity', 1);

				var shipgroup_id = (line.get('shipaddress') + line.get('shipmethod')) || (self.model.get('shipaddress') + self.model.get('shipmethod')) || 'no-address-and-method';

				if (shipgroup_id) {
					var shipgroup = self.shipgroups[shipgroup_id];
					if (!shipgroup) {
						shipgroup = {
							shipmethod: line.get('shipmethod') || self.model.get('shipmethod')
							, shipaddress: line.get('shipaddress') || self.model.get('shipaddress')
							, fulfillments: []
							, unfulfilled_lines: []
							, tracking_numbers_summary: {}
						};
						self.shipgroups[shipgroup_id] = shipgroup;
					}
					shipgroup.unfulfilled_lines.push({ line_id: line.get('internalid'), quantity: line.get('quantity'), rate: line.get('amount') });
				}
			});

			self.model.get('fulfillments').each(function (fulfillment) {
				var shipgroup = self.shipgroups[fulfillment.get('shipaddress') + fulfillment.get('shipmethod').internalid];

				if (!shipgroup) {
					shipgroup = {
						shipmethod: fulfillment.get('shipmethod').internalid
						, shipaddress: fulfillment.get('shipaddress')
						, fulfillments: []
						, unfulfilled_lines: []
						, tracking_numbers_summary: {}
					};
					self.model.get('shipmethods').add({
						internalid: fulfillment.get('shipmethod').internalid
						, name: fulfillment.get('shipmethod').name
					});
					self.shipgroups[fulfillment.get('shipaddress') + fulfillment.get('shipmethod').internalid] = shipgroup;
				}

				shipgroup.fulfillments.push(fulfillment);

				_.each(fulfillment.get('lines'), function (line) {
					if (line.line_id) {
						var unfulfilled_line = _.findWhere(shipgroup.unfulfilled_lines, { line_id: line.line_id });
						if (!unfulfilled_line) {
							unfulfilled_line = { line_id: line.line_id, quantity: line.quantity };
							shipgroup.unfulfilled_lines.push(unfulfilled_line);
						}

						unfulfilled_line.quantity -= +line.quantity;
						unfulfilled_line.rate -= + line.rate;
					}
				});
			});

			_.each(self.shipgroups, function (shipgroup) {
				shipgroup.unfulfilled_lines = _.reject(shipgroup.unfulfilled_lines, function (line) {
					return line.quantity === 0;
				});

				if (shipgroup.unfulfilled_lines.length) {
					shipgroup.fulfillments.push(new Backbone.Model({
						is_pending: true
						, lines: shipgroup.unfulfilled_lines
					}));
				}
			});

			self.options.application.getLayout().showContent(self, 'ordershistory', [{
				text: _('Order History &amp; Returns').translate(),
				href: '/ordershistory'
			}, {
				text: '#' + self.model.get('order_number'),
				href: '/ordershistory/view/' + self.model.get('id')
			}]);

			self.toggleReturns('hide');
		}

		, showTrakingNumbers: showTrakingNumbers

		// reorder all items (incluiding quantity and options) of an order.
		, reorderAll: function (e) {
			e.preventDefault();

			var add_items = []
				, self = this
				, application = this.options.application;

			this.$('[data-re-order-item-link]').each(function (index, item_link) {
				var $item_link = jQuery(item_link)
					, selected_line_id = $item_link.data('re-order-item-link')
					, selected_line = self.model.get('lines').get(selected_line_id)
					, item_to_cart = selected_line.get('item');

				item_to_cart.setOptionsArray(selected_line.get('options'), true);
				add_items.push(item_to_cart);
			});

			application.getCart().addItems(add_items, {
				success: function () {
					var non_gift_count = self.$('[data-re-order-item-link]').size()
						, gift_count = self.$('[data-giftcard-item-link]').size()
						, total_no_gift_items_to_add = _.reduce(add_items, function (acc, n) {
							return acc + n.get('quantity');
						}, 0)
						, msg_str = '';

					if (gift_count > 0) {
						msg_str += '<p>' + _('$(0) of $(1) Items successfully added to <a href="#" data-touchpoint="viewcart">your cart</a></br>').translate(non_gift_count, non_gift_count + gift_count) + '</p>';

						self.$('[data-giftcard-item-link]').each(function () {
							var gifcard_item_link = jQuery(this).data('giftcard-item-link')
								, giftcard_item_name = jQuery(this).data('giftcard-item-name');

							msg_str += '<p>';
							msg_str += _('Your Gift Card "$(0)" was not added to your cart because it must be personalized.').translate(giftcard_item_name);
							msg_str += '<a data-hashtag="#' + gifcard_item_link + '" href="' + gifcard_item_link + '" data-touchpoint="home">' + _('Personalize a new Gift Card now.').translate() + '</a>';
							msg_str += '</p>';
						});
					}
					else {
						if (non_gift_count > 1) {
							msg_str += _('$(0) Items successfully added to <a href="#" data-touchpoint="viewcart">your cart</a><br/>').translate(total_no_gift_items_to_add);
						}
						else {
							msg_str += _('Item successfully added to <a href="#" data-touchpoint="viewcart">your cart</a><br/>').translate();
						}
					}

					var $msg_el = jQuery(SC.macros.message(msg_str, 'success', true));

					self.$('[data-type=alert-placeholder]').append($msg_el);

					// amount of time the link is shown
					setTimeout(function () {
						$msg_el.fadeOut(function () {
							$msg_el.remove();
						});
					}, 3500);
				}
			});
		}

		// navigate to cart
		, goToCart: function () {
			window.location = this.options.application.getConfig('siteSettings.touchpoints.viewcart');
		}

		// reorder one item from an order (including quantity and options)
		, reorderItem: function (e) {
			e.preventDefault();
			var self = this;

			//var fitProfile = JSON.parse(this.$(e.target).data('data-item-options'));
			var application = this.options.application
				, $link = this.$(e.target)
				, selected_line_id = this.$(e.target).data('re-order-item-link')
				, selected_line = this.model.get('lines').get(selected_line_id)
				, item_to_cart = selected_line.get('item');

			var temp = selected_line_id.split('_');
			var detailsLineId = temp[0] + '_' + (parseInt(temp[1]) + 1);
			var detailsLine = this.model.get('lines').get(detailsLineId)

			//var orderOptions = _.union(detailsLine.get('options'), selected_line.get('options'));


			var clientId = _.findWhere(selected_line.get('options'), { id: 'custcol_tailor_client' }).value;
			var fitProfiles = JSON.parse(_.findWhere(selected_line.get('options'), { id: 'custcol_fitprofile_summary' }).value);

			var fitProfileCollection = [];
			var haserror = false;
			var param = new Object();
			param.type = "get_profile";
			param.data = JSON.stringify({ filters: ["custrecord_fp_client||anyof|list|" + clientId], columns: ["internalid", "name", "created", "lastmodified", "custrecord_fp_product_type", "custrecord_fp_measure_type", "custrecord_fp_measure_value"] });
			_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "GET", param).always(function (data) {
				if (data) {

					_.each(fitProfiles, function (el) {
						var selectedFitProfile = _.findWhere(JSON.parse(data), { name: el.value });
						fitProfileCollection.push(selectedFitProfile);
					});

					_.each(fitProfileCollection, function (el) {
						try{
						var fitColumn = "custcol_fitprofile_" + el.custrecord_fp_product_type.toLowerCase();
						var fitValue = el.custrecord_fp_measure_value;
						item_to_cart.setOption(fitColumn, fitValue,true);
					}catch(e){
						var $msg_el = jQuery(SC.macros.message('Cannot reorder item due to data error', 'error', true));
						self.$('[data-type=alert-placeholder]').append($msg_el);
						haserror = true;
					}
					});
					//item_to_cart.setOptionsArray(orderOptions, true);
					item_to_cart.setOptionsArray(selected_line.get('options'), true);

					// Test issue #102
					item_to_cart.set('quantity', 1);

					item_to_cart.setOption('custcol_avt_date_needed', '1/1/1900');
					item_to_cart.setOption('custcol_avt_wbs_copy_key', item_to_cart.get('internalid').toString() + '_' + new Date().getTime());

					if(haserror) return;
					application.getCart().addItem(item_to_cart, {
						success: function () {
							jQuery('p.success-message').remove();
							var $success = jQuery('<p/>').addClass('success-message');

							// when sucess we temporarily show a link to the user's cart
							if (item_to_cart.quantity > 1) {
								$success.html(item_to_cart.quantity + _(' items successfully added to <a href="#" data-touchpoint="viewcart">your cart</a></br>').translate()).insertAfter($link);
							}
							else {
								$success.html(_('Item successfully added to <a href="#" data-touchpoint="viewcart">your cart</a></br>').translate()).insertAfter($link);
							}

							// amount of time the link is shown
							setTimeout(function () {
								$success.fadeOut(function () {
									$success.remove();
								});
							}, 3500);
						}
					});
				}
			});


		}

		// togle the view of the order's returns (if available)
		, toggleReturns: function (how) {
			var $body = this.$('#returnauthorizations-details-body');

			if (_.isString(how)) {
				$body[how === 'show' ? 'show' : 'hide']();
			}
			else {
				$body.toggle();
			}

			this.$('#returnauthorizations-details-header .icon-chevron-right')[$body.is(':visible') ? 'addClass' : 'removeClass']('icon-chevron-down');
		}

		// scroll the page up to the order's return
		, goToReturns: function (e) {
			e.preventDefault();
			this.toggleReturns('show');

			jQuery('html, body').animate({
				scrollTop: this.$('#returnauthorizations-details').first().offset().top
			}, 500);
		}

		, initialize: function (options) {
			this.application = options.application;
		}

		, getTrackingServiceUrl: function (number) {
			return TrackingServices.getServiceUrl(number);
		}

		, isReturnable: function () {
			var model = this.model
				, returned_lines = []
				, lines = model.get('lines').clone();

			model.get('returnauthorizations').each(function (sibling) {
				sibling.get('lines').each(function (line) {
					var item_id = line.get('item').id

						, same_item_line = lines.find(function (line) {
							return line.get('item').id === item_id;
						})

						, quantity = parseFloat(same_item_line.get('quantity')) + parseFloat(line.get('quantity'));

					same_item_line.set('quantity', quantity);

					returned_lines.push(line);
				});
			});

			returned_lines = lines.filter(function (line) {
				return !line.get('quantity') || !line.get('item').get('_isReturnable');
			});

			lines.remove(returned_lines);

			return model.get('isReturnable') && lines.length;
		}
	});

	// view list of orders
	Views.List = Backbone.View.extend({
		template: 'order_history',
		title: _('Order History').translate(),
		page_header: _('Order History').translate(),
		attributes: {
			'class': 'OrderListView'
		}

		, events: {
			'click [rel=clickover]': 'showTrakingNumbers'
			, 'click button[rel=search]': 'search'
			, 'click button[id="sortred"]': 'sortRed'
			, 'blur [name="oh_dateneeded"]': 'updateDateNeeded'
			,	'change [data-name="flag"]': 'updateFlag'
			, 'click #modalContainerSave' : 'updateFlagDetails'
			, 'click [data-dismiss="modal"]': 'closemodal'
		}
		, closemodal: function(){
				jQuery('#modalContainer').modal('hide')
		}
		, updateFlag: function(e){
				var id = jQuery(e.target).data().id;
				if(e.target.checked){
					var texthtml = "<input type='text' data-name='flagdetails' data-id='"+id+"' style='width:100%;'>";
					jQuery('.modal-body').html(texthtml)
					jQuery('#modalContainer').modal('show')
				}
				else{
					this.collection.each(function (model) {
							if (model.get('solinekey') == id) {
								model.set('custcol_flag_comment', '');
								model.set('custcol_flag','F')
								model.save();
							}
						});
				}
		}
		, updateFlagDetails: function(e){
			var id = jQuery('[data-name="flagdetails"]').data().id;
			this.collection.each(function (model) {
					if (model.get('solinekey') == id) {
						model.set('custcol_flag_comment',  jQuery('[data-name="flagdetails"]').val());
						model.set('custcol_flag','T')
						model.save();
					}
				});
				jQuery('#modalContainer').modal('hide')
		}
		// ,	initialize: function (options)
		// 	{
		// 		this.options = options;
		// 		this.collection = options.collection;
		// 		this.application = options.application;
		// 		this.search = options.search;
		// 		this.page = options.page;
		//
		// }
		, sortRed: function (e) {
			e.preventDefault();
			var url = "ordershistory"

				url += "?sort=true";

			Backbone.history.navigate(url, true);
		}
		, search: function (e) {
			e.preventDefault();
			var url = "ordershistory"
				, search_keyword = jQuery("input[rel=search]").val();
			if (search_keyword) {
				url += "?search=" + search_keyword;
			}
			Backbone.history.navigate(url, true);
		}
		, updateDateNeeded: function (e) {
			e.preventDefault();
			var valueofdate = e.target.value;
			if (valueofdate) {
				var today = new Date(valueofdate);
				this.collection.each(function (model) {
					if (model.get('solinekey') == e.target.id) {
						model.set('custcol_avt_date_needed', today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear());
						model.save();
					}
				});

			}
			//var placed-order-model = this.collection.find(function(model) { return model.get('custcol_avt_saleorder_line_key') === 'Lee'; });
		}
		, showContent: function () {

			this.options.application.getLayout().showContent(this, 'ordershistory', [{
				text: this.title
				, href: '/ordershistory'
			}]);
			jQuery('[data-toggle="tooltip"]').tooltip();
		}

		, showTrakingNumbers: showTrakingNumbers

		, getTrackingServiceUrl: function (number) {
			return TrackingServices.getServiceUrl(number);
		}
	});

	return Views;
});
