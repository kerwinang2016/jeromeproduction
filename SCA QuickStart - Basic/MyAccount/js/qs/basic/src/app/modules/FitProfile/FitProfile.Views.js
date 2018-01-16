// Profile.Views.js
// -----------------------
// Views for profile's operations
define('FitProFile.Views', ['Client.Model', 'Profile.Model', 'ClientOrderHistory.Collection', 'ItemDetails.Model', 'ProductList.Model', 'ProductListItem.Model', 'ProductListDetails.View'], function (ClientModel, ProfileModel, Collection, ItemDetailsModel, ProductListModel, ProductListItemModel, ProductListDetailsView) {
	'use strict';

	var Views = {};
	var saveForLaterItems = [];
	var saveForlater = [];

	// home page view
	Views.Home = Backbone.View.extend({

		template: 'fit_profile'
		, title: _('Fit Profile').translate()
		, attributes: { 'class': 'FitProfileHomeView' }
		, events: {
			'change select#clients-options': 'getFitProfile'
			, 'change select#profiles-options': 'getProfileDetails'
			, 'click [data-action=remove-rec]': 'removeRec'
			, 'click [data-action=copy-profile]': 'copyProfile'
			, 'click [data-action=add-profile]': 'addProfile'
			, 'click [id=swx-order-client-search]': 'swxOrderClientSearch'
			, 'click [id=swx-client-profile-select]': 'swxClientProfileSelect'
			, 'click [id=swx-back-to-client-profile-search]': 'swxBackToClientSearch'
			, 'click [id=swx-fitprofile-butt-add]': 'swxFitProfileAdd'
			, 'click [id=swx-fitprofile-viewedit]': 'swxFitProfileViewEdit'
			, 'click [id=swx-fitprofile-copy]': 'swxFitProfileCopy'
			, 'click [id=swx-fitprofile-remove]': 'swxFitProfileRemove'

			, 'click [id=butt-modal-submit]': 'swxFitProfileModalButtSubmit'
			, 'click [id=butt-modal-copy]': 'swxFitProfileModalButtCopy'
			, 'click [id=butt-modal-remove]': 'swxFitProfileModalButtRemove'
			, 'click [id=swx-later-add-order]': 'swxFitProfileAddOrder'
			, 'blur [name="oh_dateneeded"]': 'updateDateNeeded'

			//, 'keypress [id="swx-order-client-name"]':'keyPressSwxOrderClientSearch'
			//, 'keypress [id="swx-order-client-email"]':'keyPressSwxOrderClientSearch'
			//, 'keypress [id="swx-order-client-phone"]':'keyPressSwxOrderClientSearch'
		}
		, initialize: function (options) {
			this.model = options.model;
			this.application = options.application;
			SC.clients = options.clients;
			this.cart = this.application.getCart();
			this.clientOrderHistory = [];

			this.model.set('swx_order_client_name', '');
			this.model.set('swx_order_client_email', '');
			this.model.set('swx_order_client_phone', '');
			this.model.set('swx_selected_client_id', '');
			this.model.set('swx_is_display_client_details', '');
			this.model.set('swx_client_profile_order_history', '');



		}

		// Gets the ItemDetailsModel for the cart
		, getItemForCart: function (id, qty, opts) {
			return new ItemDetailsModel({
				internalid: id
				, quantity: qty
				, options: opts
			});
		}

		, keyPressSwxOrderClientSearch: function (e) {
			if (e.which === 13) {
				this.swxOrderClientSearch();
			}
		}

		, updateDateNeeded: function (e) {
			var $ = jQuery;
			var optionsearch = {
				page: 1,
				search: this.model.get('swx_order_client_name')
			};
			//console.log('updateDateNeeded trigger from FitProfile.Views.js');

			e.preventDefault();
			var valueofdate = e.target.value;
			if (valueofdate) {
				var today = new Date(valueofdate);
				this.clientOrderHistory.each(function (model) {
					if (model.get('solinekey') == e.target.id) {
						model.set('dateneeded', today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear());
						model.save();
						//model.cachedSync();
						//console.log('model', model);
						//console.log('model.save()');

					}
				});

				//this.clientOrderHistory.reset(this.clientOrderHistory);

				//console.log('{ reset: true, killerId: this.application.killerId, data: optionsearch }', { reset: true, killerId: this.application.killerId, data: optionsearch });
				//this.swxClientProfileOrderHistory();
				// this.clientOrderHistory
				// 	.on('reset', this.swxClientProfileOrderHistory())
				// 	.fetch({ reset: true, killerId: this.application.killerId, data: optionsearch });
			}
		}

		, showContent: function () {
			var self = this;
			this.application.getLayout().showContent(this, 'fitprofile', []);
			if (this.model.get("current_client")) {
				jQuery("#profile-options").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, this.model.get("current_client")));
			}

			if (this.model.get("current_profile")) {
				jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, self.model.get("current_profile")));

				var profileView = new Views.Profile({
					model: self.model.profile_collection.get(self.model.get("current_profile"))
					, application: self.application
					, fitprofile: self.model
				});

				profileView.render();
				jQuery("#profile-section").html(profileView.$el);
			}

			_.toggleMobileNavButt();
		}

		, swxOrderClientSearch: function (e) {
			var $ = jQuery;
			this.model.set('swx_client_profile_order_history', '');

			jQuery("div[data-type='alert-placeholder']").empty();
			//var clientModel = this.model.get('current_client')
			var clientCollection = this.model.client_collection
			var stClientCollection = JSON.stringify(clientCollection);
			var arrObjClientCollection = (!_.isNullOrEmpty(stClientCollection)) ? JSON.parse(stClientCollection) : [];
			this.model.set('swx_order_client_name', this.$('input[name=swx-order-client-name]').val());
			this.model.set('swx_order_client_email', this.$('input[name=swx-order-client-email]').val());
			this.model.set('swx_order_client_phone', this.$('input[name=swx-order-client-phone]').val());
			this.model.set('swx_is_display_client_details', '');

			var objFilters = {};
			objFilters['name'] = this.model.get('swx_order_client_name');
			objFilters['email'] = this.model.get('swx_order_client_email');
			objFilters['phone'] = this.model.get('swx_order_client_phone');

			var arrObjClient = _.getArrObjOrderClientList(arrObjClientCollection, objFilters)

			//console.log('objFilters: ' + '\n' + JSON.stringify(objFilters, 'key', '\t'))
			//console.log('arrObjClient: ' + '\n' + JSON.stringify(arrObjClient, 'key', '\t'))
			//console.log('swxOrderClientSearch: ' + '\n' + JSON.stringify(clientCollection, 'key', '\t'))

			$("[id='order-history']").empty();
			var arrObjClientList = [];
			$("#swx-order-client-list").empty();
			$("#swx-order-client-list").html(SC.macros.swxOrderClientList(arrObjClient));

			_.toggleMobileNavButt();
		}


		, swxFitProfileAddOrder: function (e) {

			e.preventDefault();

			var selectedClientItemId = e.target.getAttribute('swx-client-item-id');

			//console.log('swxFitProfileAddOrder>selectedClientItemId', selectedClientItemId);
			//console.log('saveForLaterItems', saveForlater);


			//Filter the saveForLaterItems
			// var itemToAdd = _.findWhere(saveForLaterItems, { displayname: selectedClientItemId });
			// var tempItem = itemToAdd.itemObject;
			// console.log('tempItem', tempItem);

			//console.log('self.model.get(items)',this.model('items'));

			//var itemDetails = this.getItemForCart(itemToAdd.internalid,itemToAdd.quantity);
			//console.log('itemToAdd.internalid',itemToAdd.internalid);

			// var self = this
			// ,	selected_product_list_item_id = itemToAdd.internalid
			// ,	selected_product_list_item = self.model.get('items').findWhere({
			//  		internalid: selected_product_list_item_id.toString()
			//  	});
			// ,	selected_item = selected_product_list_item.get('item')
			// ,	selected_item_internalid = selected_item.internalid
			// ,	item_detail = self.getItemForCart(selected_item_internalid, selected_product_list_item.get('quantity'));

			// item_detail.set('_optionsDetails', selected_item.itemoptions_detail);
			// item_detail.setOptionsArray(selected_product_list_item.getOptionsArray(), true);

			// var add_to_cart_promise = this.addItemToCart(item_detail)
			// ,	whole_promise = null;

			// if (this.sflMode)
			// {
			// 	whole_promise = jQuery.when(add_to_cart_promise, this.deleteListItem(selected_product_list_item)).then(jQuery.proxy(this, 'executeAddToCartCallback'));
			// }
			// else
			// {
			// 	whole_promise = jQuery.when(add_to_cart_promise).then(jQuery.proxy(this, 'showConfirmationHelper', selected_product_list_item));
			// }

			// if (whole_promise)
			// {
			// 	this.disableElementsOnPromise(whole_promise, 'article[data-item-id="' + selected_item_internalid + '"] a, article[data-item-id="' + selected_item_internalid + '"] button');
			// }






			// this.application.getCart().addItem(itemToAdd.itemObject).done(function () {
			// 	console.log('added to cart');
			// });

		}



		, swxClientProfileOrderHistory: function (e) {
			var $ = jQuery;

			//console.log('swxClientProfileOrderHistory');

			var optionsearch = {
				page: 1,
				search: this.model.get('current_client')//this.model.get('swx_order_client_name')
			};

			//Backbone.Relational.store.reset();

			var filteredClientOrderHistory = [];
			this.clientOrderHistory = new Collection(optionsearch.search);
			this.clientOrderHistory.reset();
			var self = this;
			var clientFullName = $('#fitProfileClientName').html();
			this.clientOrderHistory.fetch().done(function () {
				//console.log('self.clientOrderHistory', self.clientOrderHistory);
				self.clientOrderHistory.each(function (model) {
					if (model.get('client_name') == clientFullName) {
						filteredClientOrderHistory.push({
							transtatus: model.get('status'),
							orderDate: model.get('date'),
							orderNum: model.get('so_id'),
							item: model.get('item'),
							fabricStatus: model.get('fabricstatus'),
							cmtStatus: model.get('cmtstatus'),
							dateNeeded: model.get('dateneeded'),
							status: model.get('tranline_status'),
							solinekey: model.get('solinekey'),
							internalid: model.get('internalid')
						});
					}
				});
				$("#order-history").html(SC.macros.fitProfileClientorderHistoryMacro(filteredClientOrderHistory));
			});
		}
		, swxClientProfileSelect: function (e) {

			jQuery("div[data-type='alert-placeholder']").empty();
			var currentUser = this.application.getUser().get("internalid");
			var clientOptionsSelectId = 'clients-options';
			var clientCollection = this.model.client_collection
			var stClientCollection = JSON.stringify(clientCollection);
			var arrObjClientCollection = (!_.isNullOrEmpty(stClientCollection)) ? JSON.parse(stClientCollection) : [];

			var $ = jQuery;

			this.model.set('swx_is_display_client_details', 'T');
			var selectedClientIdValue = e.target.getAttribute('swx-client-id');
			this.model.set('swx_selected_client_id', selectedClientIdValue);

			this.$("select[id='" + clientOptionsSelectId + "']").val(selectedClientIdValue);
			this.$("select[id='" + clientOptionsSelectId + "']").change();

			//var arrObjClient = _.getArrObjOrderClientList(arrObjClientCollection, objFilters)

			$("#swx-client-profile-details").empty();
			$("[id='order-history']").empty();
			$("div[id='swx-client-profile-list']").hide();

			//console.log('swxClientProfileSelect: ' + '\n' + 'arrObjClientCollection: ' + '\n' + JSON.stringify(arrObjClientCollection, 'key', '\t'))

			$("#swx-client-profile-details").html(SC.macros.swxMyAccountClientProfileDetails(arrObjClientCollection, selectedClientIdValue));
			$("div[id='swx-client-profile-view']").show();
			//console.log('swxClientProfileSelect: ' + '\n' + 'selectedClientIdValue: ' + selectedClientIdValue + '\n' + 'currentUser: ' + currentUser)

			var objRef = {};
			objRef['customerid'] = currentUser;
			objRef['clientprofileid'] = selectedClientIdValue;

			var optionsearch = {
				page: 1,
				search: this.model.get('swx_order_client_name')
			};

			this.swxClientProfileOrderHistory();

			var self = this;

			this.application.getSavedForLaterProductList(self.model.get('swx_order_client_name')).done(function (response) {
				var objSFL = response;
				objSFL['swx_filter_save_for_later_client'] = self.model.get('swx_order_client_name');
				//console.log('Cart.saveForLater.View.js>objSFL', objSFL);
				self.renderSaveForLaterSectionHelper(new ProductListModel(objSFL));
			});


		}

		, addToCart: function () {
			var self = this;
			//console.log('added to card callback.');
			this.application.getSavedForLaterProductList(self.model.get('swx_order_client_name')).done(function (response) {
				var objSFL = response;
				objSFL['swx_filter_save_for_later_client'] = self.model.get('swx_order_client_name');
				//console.log('Cart.saveForLater.View.js>objSFL', objSFL);
				self.renderSaveForLaterSectionHelper(new ProductListModel(objSFL));
			});
		}

		, renderSaveForLaterSectionHelper: function (pl_model) {
			var self = this
				, application = this.application;

			//console.log('fitProfile>application', this.application);
			this.product_list_details_view = new application.ProductListModule.Views.Details({ application: application, model: pl_model, sflMode: true, addToCartCallback: function () { self.addToCart(); } });
			this.product_list_details_view.template = 'product_list_details_later';
			this.$('#saveForLaterItems').empty();
			this.$('#saveForLaterItems').append(this.product_list_details_view.render().el);
		}

		, swxBackToClientSearch: function (e) {
			this.model.set('swx_is_display_client_details', '');
			this.model.set('swx_client_profile_order_history', '');

			var $ = jQuery;

			var clientOptionsSelectId = 'clients-options';

			$("button[id='swx-order-client-search']").click();


			this.$("select[id='" + clientOptionsSelectId + "']").val('');
			this.$("select[id='" + clientOptionsSelectId + "']").change();

			$("[id='fit-profile']").empty();
			$("[id='profile-section']").empty();
			$("[id='order-history']").empty();
			$("[id='saveForLaterItems']").empty();
			$("[id='swx-client-profile-details']").empty();
			$("[id='swx-client-profile-list']").show();
			$("[id='swx-order-client-contents']").show();
		}

		, swxFitProfileAdd: function (e) {
			var $ = jQuery;
			jQuery("a[id='swx-fitprofile-dropdown-add']").click();
			$("[id='butt-modal']").click();
		}

		, swxFitProfileCopy: function (e) {
			var $ = jQuery;
			jQuery("[id='swx-fitprofile-dropdown-copy']").click();
			jQuery("form[id='profile-form']").find("input[id='name']").focus();
			jQuery("[id='h3-profile-header']").text('Copy Profile');
			jQuery("[id='swx-fitprofile-copy']").hide();
			jQuery("[id='swx-fitprofile-remove']").hide();


		}

		, swxFitProfileRemove: function (e) {
			var $ = jQuery;
			jQuery("[id='swx-fitprofile-dropdown-remove']").click();
		}


		, swxFitProfileViewEdit: function (e) {

			var $ = jQuery;
			var selectedProfileIdValue = e.target.getAttribute('swx-fitprofile-id');

			$("select[id='profiles-options']").val(selectedProfileIdValue);
			$("select[id='profiles-options']").change();

			$("[id='butt-modal-submit']").show();
			$("[id='butt-modal-remove']").show();
			$("[id='butt-modal-copy']").show();

			$("[id='butt-modal']").click();

		}

		, swxFitProfileModalButtSubmit: function (e) {
			var $ = jQuery;
			jQuery("[id='swx-fitprofile-submit']").click();
		}

		, swxFitProfileModalButtRemove: function (e) {
			//var $ = jQuery;
			//var message = _("Are you sure that you want to delete this client and their fit profiles?").translate();
			//if (window.confirm(message)) {
			jQuery("[id='swx-fitprofile-remove']").click();
			//}
		}

		, swxFitProfileModalButtCopy: function (e) {
			var $ = jQuery;
			jQuery("[id='butt-modal-remove']").hide();
			jQuery("[id='butt-modal-copy']").hide();
			jQuery("[id='swx-fitprofile-copy']").click();
		}

		, getFitProfile: function (e) {
			var clientID = jQuery(e.target).val();
			var self = this;
			this.model.set("current_profile", null);
			this.model.set("current_client", clientID);

			this.model.on("afterProfileFetch", function () {
				jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, clientID));

				var profileView = new Views.Profile({
					model: new ProfileModel()
					, application: self.application
					, fitprofile: self.model
				});


				profileView.render();
				//jQuery("#profile-section").html(profileView.$el);
			});

			if (clientID) {
				jQuery("#client-actions").html("<a data-toggle='show-in-modal' href='/fitprofile/new|client|" + this.application.getUser().get("internalid") + "'>Add</a> | <a data-toggle='show-in-modal' href='/fitprofile/" + clientID + "|client'>View & Edit</a> | <a id='swx-fitprofile-dropdown-remove' data-action='remove-rec' data-type='client' data-id='" + clientID + "'>Remove</a> | <a data-hashtag='#/item-types?client=" + clientID + "' data-touchpoint='home' href='/item-types?client=" + clientID + "'>Create Order</a>");
				jQuery("#profile-section").html("");
			} else {
				jQuery("#client-actions").html("<a data-toggle='show-in-modal' href='/fitprofile/new|client|" + this.application.getUser().get("internalid") + "'>Add</a>");
				this.resetForm()
			}
		}

		, copyProfile: function (e) {
			this.model.set("current_profile", null);
			jQuery("#profile-form #name").val("");
		}
		, addProfile: function (e) {
			var clientID = jQuery("#clients-options").val();
			this.model.set("current_client", clientID);

			//var currentClientId = this.model.get("current_client");
			//this.model.set("current_client", currentClientId);

			var profileView = new Views.Profile({
				model: new ProfileModel()
				, application: this.application
				, fitprofile: this.model
			});

			profileView.render();
			jQuery("#profile-section").html(profileView.$el);

			this.model.set("current_profile", null);
			this.getProfileDetails(e);
			jQuery("#profiles-options").val("");
		}
		, removeRec: function (e) {
			e.preventDefault();
			//console.log('Path:MyAccount>FitProfile.Views.js>removeRec>triggered');
			// April CSD Issue #036
			var message = _("Are you sure that you want to delete this client and their fit profiles?").translate()
				, conditionContent = jQuery(e.target).data('type') === "client" ? window.confirm(message) : true;

			if (conditionContent) {
				var selector = jQuery(e.target)
					, id = selector.data("id")
					, type = selector.data("type")
					, self = this;

				this.model.removeRec(type, id);
				this.model.on("afterRemoveRec", function () {
					self.model.set("current_client", null);
					self.model.set('swx_is_display_client_details', '');
					self.showContent();
				});
			}
		}

		, getProfileDetails: function (e) {
			var profileID = jQuery(e.target).val();
			var self = this;
			this.model.set("current_profile", profileID);
			var $ = jQuery;

			if (profileID) {
				jQuery("#profile-actions").html("<a id='swx-fitprofile-dropdown-add' data-action='add-profile' data-toggle='show-in-modal' data-type='profile'>Add</a> | <a id='swx-fitprofile-dropdown-copy' data-action='copy-profile' data-type='profile' data-id='" + profileID + "'>Copy</a> | <a id='swx-fitprofile-dropdown-remove' data-action='remove-rec' data-type='profile' data-id='" + profileID + "'>Remove</a>");
				var profileView = new Views.Profile({
					model: self.model.profile_collection.get(self.model.get("current_profile"))
					, application: self.application
					, fitprofile: self.model
				});

				var selectedProfile = self.model.profile_collection.where({internalid: self.model.get("current_profile")})[0];
				var selectedUnit = JSON.parse(selectedProfile.get('custrecord_fp_measure_value'))[0].value;

				//console.log('[NOTE:Testing only]MyAccount>FitProfile.Views.js>getProfileDetails>selectedUnit',selectedUnit);

				profileView.render(selectedUnit);
				jQuery("#profile-section").html(profileView.$el);

			} else {
				jQuery("#profile-actions").html("<a id='swx-fitprofile-dropdown-add' data-action='add-profile' data-toggle='show-in-modal' data-type='profile'>Add</a>");
				// check if event was triggered by add button
				if (e.target.innerText === "Add") {
					//display profile details
					jQuery("#profile-details").html(SC.macros.profileForm(self.model, 'add'));
				} else {
					//hide profile section
					jQuery("#profile-section").html("");
				}
			}
		}

		, resetForm: function () {
			jQuery("#fit-profile").html("");
			jQuery("#profile-section").html("");
		}
		, displayProfiles: function (resData, type, isClient) { // Test issue #88
			var clientID = isClient ? resData.id : resData.rec.custrecord_fp_client;
			var self = this;
			this.model.set("current_client", clientID);

			if (type == "new") { // If new client
				this.model.on("afterProfileFetch", function () {
					jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, clientID));

					var profileView = new Views.Profile({
						model: new ProfileModel()
						, application: self.application
						, fitprofile: self.model
					});

					//console.log('displayProfiles: ' + 'if type == "new"');
					_.toggleMobileNavButt();

					//var stAlertMsg = '<div class="alert alert-success"><button data-dismiss="alert" class="close">&times;</button>Record was added</div>';
					//jQuery("div[data-type='alert-placeholder']").html(stAlertMsg)

					profileView.render();
					jQuery("[id='butt-modal-close']").click();
				});
			} else if (isClient) {
				jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, clientID));

				var profileView = new Views.Profile({
					model: new ProfileModel()
					, application: self.application
					, fitprofile: self.model
				});

				//console.log('displayProfiles: ' + 'else if (isClient)')
				this.model.set('swx_is_display_client_details', 'T');

				var currentUser = this.application.getUser().get("internalid");

				var objRef = {};
				objRef['customerid'] = currentUser;
				objRef['clientprofileid'] = clientID;

				_.suiteRest('getClientProfileOrderHistory', objRef).always(function (data) {

					if (data) {
						var stClientHistory = JSON.stringify(data);
						//this.model.set('swx_client_profile_order_history', stClientHistory);
						//console.log('suiteRest' + '\n' + JSON.stringify(data, 'key', '\t'));

						jQuery("#order-history").html(SC.macros.swxMyAccountClientProfileOrderHistory(data));
						_.toggleMobileNavButt();
					}

				});


				profileView.render();
				_.toggleMobileNavButt();
				jQuery("[id='butt-modal-close']").click();
			} else {
				if (self.model.profile_collection && !isClient) { //If new fitprofile
					this.model.set("current_profile", resData.id); // resData.id == profile id
					jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, clientID));

					var profileView = new Views.Profile({
						model: self.model.profile_collection.get(self.model.get("current_profile"))
						, application: self.application
						, fitprofile: self.model
					});

					//console.log('displayProfiles: ' + 'else type == "new"')

					profileView.render();

					jQuery("[id='swx-fitprofile-copy']").show();
					jQuery("[id='swx-fitprofile-remove']").show();
					jQuery("[id='h3-profile-header']").text('View/Edit Profile');
					_.toggleMobileNavButt();
					jQuery("[id='butt-modal-close']").click();

				}
			}

			jQuery("select#clients-options option").each(function () {
				if (jQuery(this).val() == clientID) {
					jQuery(this).attr("selected", "selected");
				}
			});

			if (clientID) {
				jQuery("#client-actions").html("<a data-toggle='show-in-modal' href='/fitprofile/new|client|" + this.application.getUser().get("internalid") + "'>Add</a> | <a data-toggle='show-in-modal' href='/fitprofile/" + clientID + "|client'>View & Edit</a> | <a data-action='remove-rec' data-type='client' data-id='" + clientID + "'>Remove</a> | <a data-hashtag='#/item-types?client=" + clientID + "' data-touchpoint='home' href='/item-types?client=" + clientID + "'>Create Order</a>");
			} else {
				jQuery("#client-actions").html("<a data-toggle='show-in-modal' href='/fitprofile/new|client|" + this.application.getUser().get("internalid") + "'>Add</a>");
				this.resetForm()
			}

			if (!isClient) {
				setTimeout(function () { // delay added to fetch the latest fit profile list
					jQuery("select#profiles-options option").each(function () {
						if (jQuery(this).val() == resData.id) { // resData.id == profile id
							jQuery(this).attr("selected", "selected");
						}
					});
					jQuery("#profile-actions").html("<a href='/fitprofile' id='swx-fitprofile-dropdown-add' data-action='add-profile' data-toggle='show-in-modal' data-type='profile'>Add</a> | <a id='swx-fitprofile-dropdown-copy' data-action='copy-profile' data-type='profile' data-id='" + resData.id + "'>Copy</a> | <a id='swx-fitprofile-dropdown-remove' data-action='remove-rec' data-type='profile' data-id='" + resData.id + "'>Remove</a>");
				}, 500);
			}
		}
	});

	Views.Profile = Backbone.View.extend({
		template: 'profile'
		, events: {
			'change select#custrecord_fp_product_type': 'getMeasurementType'
			, 'change select#custrecord_fp_measure_type': 'buildMesureForm'
			, 'change select#body-fit': 'rebuildMeasureForm'
			, 'change .allowance-fld': 'updateFinalMeasure'
			, 'change .body-measure-fld': 'updateFinalMeasure'
			, 'change #fit': "updateAllowanceLookup"
			, 'change .block-measurement-fld': 'disableCounterBlockField'
			, 'submit #profile-form': 'submitProfile'
			, 'change [id="units"]':'changedUnits'
		}

		, initialize: function (options) {
			this.model = options.model;
			this.fitprofile = options.fitprofile;
			var self = this;
			jQuery.get(_.getAbsoluteUrl('js/presetsConfig.json')).done(function (data) {
				window.presetsConfig = JSON.parse(data);
			});
			jQuery.get(_.getAbsoluteUrl('js/itemRangeConfig.json')).done(function (data) {
				window.cmConfig = data;
			});
			jQuery.get(_.getAbsoluteUrl('js/itemRangeConfigInches.json')).done(function (data) {
				window.inchConfig = data;
			});
		}

		,changedUnits : function(el){
			//console.log('MyAccount>FitProfile.Views.js>changeUnits-triggered');
			var $ = jQuery;

			var productType = jQuery('#custrecord_fp_product_type').val();
			var unit = $('#units').val();

			//console.log('MyAccount>FitProfile.Views.js>productType',productType);
			//console.log('MyAccount>FitProfile.Views.js>unit',unit);
			var configUrl = unit ==='CM'?'js/itemRangeConfig.json':'js/itemRangeConfigInches.json';

			jQuery.get(_.getAbsoluteUrl(configUrl)).done(function (data) {
				//console.log('data>',JSON.parse(data));
				var selectedMeasurementConfig = _.findWhere(JSON.parse(data),{ type: productType });
				//console.log('selectedMeasurementConfig>',selectedMeasurementConfig);
				_.each(selectedMeasurementConfig.config,function(el){
						//console.log('Range config '+el);
					var fiedlName = el.name;
					if(el.name === 'Sleeve L' || el.name ==='Sleeve R'){
						fiedlName = fiedlName.replace(' ','-');
					}

					$('#range_'+fiedlName).html('('+el.min+'-'+el.max+')');
					$('#finish_'+fiedlName).attr('min-value', el.min);
					$('#finish_'+fiedlName).attr('max-value', el.max);


				});
				//Update Values
				var bodyfields = jQuery('.body-measure-fld');
				if(bodyfields.length >0){
					if(unit === 'CM'){
						for(var i=0;i<bodyfields.length;i++){
							bodyfields[i].value = (parseFloat(bodyfields[i].value?bodyfields[i].value:0)*2.54).toFixed(2)
						}
					}
					else{
						for(var i=0;i<bodyfields.length;i++){
							bodyfields[i].value = (parseFloat(bodyfields[i].value?bodyfields[i].value:0)/2.54).toFixed(2)
						}
					}
				}
				jQuery('.body-measure-fld').trigger('change');
			});

			jQuery('#fit').trigger('change');
		}

		, render: function (selectedUnit) {

			var $ = jQuery;
			var self = this;

			window.itemRangeConfig = window.cmConfig;
			if(selectedUnit === 'Inches' && (selectedUnit !== null || selectedUnit !== undefined)){
				window.itemRangeConfig = window.inchConfig;
			}

			//console.log('[NOTE:Testing only]MyAccount>FitProfile.Views.js>render>configUrl',configUrl);
			this._render();

			// $.get(_.getAbsoluteUrl(configUrl)).done(function (data) {
			// 	window.itemRangeConfig = data;
			// 	//self.renderProfileForm();
			// 	//self._render();

			// 	//_.toggleMobileNavButt();
			// });


			//this._render();
			this.$("#profile-details").html(SC.macros.profileForm(this.fitprofile));
			_.toggleMobileNavButt();
		}

		, getMeasurementType: function (e) {

			jQuery("[id='butt-modal-copy']").hide();
			jQuery("[id='butt-modal-remove']").hide();
			jQuery("[id='butt-modal-submit']").hide();

			var itemType = jQuery(e.target).val()
				, self = this
				, selectedItemType = null
				, measurementType = null
				, profile = self.model.profile_collection && self.model.get("current_profile") ? self.model.profile_collection.where({ internalid: self.model.get("current_profile") })[0] : null;

			if (itemType) {
				selectedItemType = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];

				jQuery("[id='butt-modal-copy']").hide();
				jQuery("[id='butt-modal-remove']").hide();
				jQuery("[id='butt-modal-submit']").hide();

			}

			if (selectedItemType) {
				measurementType = _.pluck(selectedItemType.measurement, "type");
				jQuery("#measure-type").html(SC.macros.measureTypeDropdown(measurementType, profile ? profile.get("custrecord_fp_measure_type") : null));
				jQuery("#measure-form").html("");

				jQuery("[id='butt-modal-copy']").hide();
				jQuery("[id='butt-modal-remove']").hide();
				jQuery("[id='butt-modal-submit']").hide();

			} else {
				jQuery("#measure-type").html("");
				jQuery("#measure-form").html("");

				jQuery("[id='butt-modal-copy']").hide();
				jQuery("[id='butt-modal-remove']").hide();
				jQuery("[id='butt-modal-submit']").hide();

			}
		}

		, disableCounterBlockField: function (e) {
			var currentField = jQuery(e.target)
				, counterField = currentField.prop("id").indexOf('-max') > -1 ? currentField.prop("id").replace('-max', '-min') : currentField.prop("id").replace('-min', '-max');

			if (counterField && currentField.val() != "0") {
				jQuery("#" + counterField).prop("disabled", true);
			} else {
				jQuery("#" + counterField).removeProp("disabled");
			}
		}

		, buildMesureForm: function (e) {

			jQuery("[id='butt-modal-copy']").hide();
			jQuery("[id='butt-modal-remove']").hide();
			jQuery("[id='butt-modal-submit']").hide();

			var measureType = jQuery(e.target).val()
				, itemType = jQuery("#custrecord_fp_product_type").val()
				, self = this
				, fieldsForm = null;

			 if (measureType && itemType) {
			 	fieldsForm = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];
			 	fieldsForm = _.where(fieldsForm.measurement, { type: measureType })[0];
			 	self.processBlockFields(fieldsForm, 'Regular');
			 	self.fitprofile.selected_measurement = fieldsForm;

			 	jQuery("#measure-form").html(SC.macros.measureForm(fieldsForm));

			 	jQuery("[id='butt-modal-submit']").show();

			 } else {
			 	jQuery("#measure-form").html("");

			 	jQuery("[id='butt-modal-copy']").hide();
			 	jQuery("[id='butt-modal-remove']").hide();
			 	jQuery("[id='butt-modal-submit']").hide();
			 }
		}

		, rebuildMeasureForm: function (e) {

			jQuery("[id='butt-modal-copy']").hide();
			jQuery("[id='butt-modal-remove']").hide();
			jQuery("[id='butt-modal-submit']").hide();

			//console.log(e.target);
			var fitType = jQuery(e.target).val()
				, measureType = jQuery("#custrecord_fp_measure_type").val()
				, itemType = jQuery("#custrecord_fp_product_type").val()
				, self = this
				, fieldsForm = null;

			//console.log('rebuildMeasureForm>fitType', fitType);
			//console.log('rebuildMeasureForm>')

			if (measureType && itemType && fitType) {
				fieldsForm = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];
				fieldsForm = _.where(fieldsForm.measurement, { type: measureType })[0];
				self.processBlockFields(fieldsForm, fitType)
				self.fitprofile.selected_measurement = fieldsForm;

				//jQuery("#measure-form").html(SC.macros.measureForm(fieldsForm, [{ "name": "fit", "value": fitType }]));

				jQuery("[id='butt-modal-submit']").show();

			} else {
				jQuery("#measure-form").html("");

				jQuery("[id='butt-modal-copy']").hide();
				jQuery("[id='butt-modal-remove']").hide();
				jQuery("[id='butt-modal-submit']").hide();

			}
		}

		, processBlockFields: function (form, fittype) {
			if (form && form.fieldset && form.fieldset.length) {
				_.each(form.fieldset, function (fieldset) {
					if (fieldset && fieldset.name !== "main") {
						if (fieldset.fields && fieldset.fields.length) {
							_.each(fieldset.fields, function (field) {
								fittype = fittype.toLowerCase().replace(/ /g, '-');

								if (field[fittype] && field[fittype].max && field[fittype].min) {
									field.max = field[fittype].max;
									field.min = field[fittype].min;
								}
							});
						}
					}
				});
			}
		}

		, updateFinalMeasure: function (e) {
			var field = jQuery(e.target)
				, id = field.prop("id").indexOf("_") > -1 ? field.prop("id").split("_")[1] : field.prop("id")
				, isAllowance = field.prop("id").indexOf("_") > -1 ? true : false
				, finalMeasure = 0;

			if (isAllowance) {
				if (_.isNaN(jQuery("[id='allowance_" + id + "']").val()) || jQuery("[id='allowance_" + id + "']").val() === "") {
					// finalMeasure =  (parseFloat(jQuery("#" + id).val()) * (parseFloat(field.data("baseval")) / 100)) + parseFloat(jQuery("#" + id).val());
					finalMeasure = 0 + parseFloat(field.val());
				} else {
					//finalMeasure = parseFloat(jQuery("#" + id).val()) + parseFloat(field.val());
					finalMeasure = parseFloat(jQuery("[id='" + id + "']").val())+ parseFloat(field.val());
				}
			} else {
				if (_.isNaN(jQuery("[id='allowance_" + id + "']").val()) || jQuery("[id='allowance_" + id + "']").val() === "") {
					// finalMeasure = (parseFloat(field.val()) * (parseFloat(jQuery("#allowance_" + id).data("baseval")) / 100)) + parseFloat(field.val());
					//console.log('isAllowance>else>if.isNan',parseFloat(field.val()));
					finalMeasure = 0 + parseFloat(field.val());
				} else if (jQuery("[id='allowance_" + id + "']").val() == 0) {
					var value = jQuery("#fit").val()
						, self = this
						, lookUpTable = self.fitprofile.selected_measurement["lookup-value"][value]
						, name = jQuery(e.target).attr('name')
						, lookUpValue = _.where(lookUpTable, { field: name })
						, finalMeasure = 0
						, allowance = 0;

					var selectedUnit = jQuery('#units').val();
					//console.log('NOTE:Testing| MyAccount>FitProfile.Views.js>updateAllowanceLookup>selectedUnit>',selectedUnit);
					if(selectedUnit === 'Inches'){
						lookUpValue = (lookUpValue / 2.54);
						if(lookUpValue>0){
							lookUpValue = lookUpValue.toFixed(1);
						}
					}

					if (lookUpValue && lookUpValue.length) { // Update allowance field if there is a lookup value provided that allowance is 0
						//jQuery("#allowance_" + id).val(lookUpValue[0].value);
						jQuery("[id='allowance_" + id + "']").val(lookUpValue[0].value)
						allowance = jQuery("[id='allowance_" + id + "']").val();
					}
					finalMeasure = parseFloat(allowance) + parseFloat(jQuery("[id='" + id + "']").val());
				} else {
					//finalMeasure = parseFloat(jQuery("#allowance_" + id).val()) + parseFloat(field.val());
					//finalMeasure = parseFloat(jQuery(idAllowancePrefix + id).val()) + parseFloat(jQuery(idPrefix + id).val());
					finalMeasure = parseFloat(jQuery("[id='allowance_" + id + "']").val()) + parseFloat(jQuery("[id='" + id + "']").val())
				}
			}

			if(_.isNaN(finalMeasure)){
				finalMeasure = 0;
			}
			//console.log('finalMeasure', finalMeasure);
			var finalMeasureEl = ("#finish_" + id).replace('#', '');
			//jQuery("#finish_" + id).html(Math.round(finalMeasure * 10) / 10);
			jQuery("[id='" + finalMeasureEl + "']").html(Math.round(finalMeasure * 10) / 10);

			//Now that the final measure is set.. we need to check if there are presets to update the other measurement
			var fit = jQuery("#in-modal-fit").val() ? jQuery("#in-modal-fit").val() : jQuery("#fit").val()
			var productType = jQuery('#custrecord_fp_product_type').val()?jQuery('#custrecord_fp_product_type').val():jQuery('#in-modal-custrecord_fp_product_type').val();
			var presets = _.where(window.presetsConfig, { make: productType});
			var selectedUnit = jQuery('#units').val();
			for(var i=0;i< presets.length;i++){
				if(presets[i].profile.indexOf(fit) != -1){
					if(presets[i][id]){

						//Check for the values
						var setranges = presets[i][id];
						var index = Math.floor(setranges.length/2);
						var top = setranges.length-1, bottom = 0,notfound = true;
						do{
							var toplower = selectedUnit === 'Inches'?parseFloat(setranges[top].lower)/2.54:parseFloat(setranges[top].lower),
							topupper = selectedUnit === 'Inches'?parseFloat(setranges[top].upper)/2.54:parseFloat(setranges[top].upper),
							bottomlower = selectedUnit === 'Inches'?parseFloat(setranges[bottom].lower)/2.54:parseFloat(setranges[bottom].lower),
							bottomupper = selectedUnit === 'Inches'?parseFloat(setranges[bottom].upper)/2.54:parseFloat(setranges[bottom].upper),
							indexlower = selectedUnit === 'Inches'?parseFloat(setranges[index].lower)/2.54:parseFloat(setranges[index].lower),
							indexupper = selectedUnit === 'Inches'?parseFloat(setranges[index].upper)/2.54:parseFloat(setranges[index].upper);
							if(toplower <= parseFloat(finalMeasure) && topupper > parseFloat(finalMeasure)){
							 	notfound = false;
								index = top;
							}
							else if(bottomlower <= parseFloat(finalMeasure) && bottomupper > parseFloat(finalMeasure)){
							 	notfound = false;
								index = bottom;
							}
							else if(indexlower <= parseFloat(finalMeasure) && indexupper > parseFloat(finalMeasure)){
							 	notfound = false;
							}
							else if(indexlower > parseFloat(finalMeasure)){
								top = index;
								index = Math.floor((top - bottom)/2)+bottom;
							}
							else{
								bottom = index;
								index = Math.floor((top-bottom)/2)+bottom;
							}
						}while(notfound && (top-bottom)>1);
						if(!notfound){
							var keys = Object.keys(setranges[index].set);
							for(var l=0;l<= keys.length;l++){
								if(selectedUnit === 'Inches'){
									//if(jQuery("#"+keys[l]).val() == 0 || jQuery("#"+keys[l]).val() == '' ){
									jQuery("#"+keys[l]).val((parseFloat(setranges[index].set[keys[l]])/2.54).toFixed(1));
									jQuery('#'+keys[l]).trigger('change');
									//}
								}else{
									//if(jQuery("#"+keys[l]).val() == 0 || jQuery("#"+keys[l]).val() == '' ){
									jQuery("#"+keys[l]).val(setranges[index].set[keys[l]]);
									jQuery('#'+keys[l]).trigger('change');
									//}
								}
							}
						}
					}
				}
			}
		}
		, updateAllowanceLookup: function (e) {
			var value = jQuery(e.target).val()
				, self = this
				, lookUpTable = JSON.parse(JSON.stringify(self.fitprofile.selected_measurement["lookup-value"][value]));

			var selectedUnit = jQuery('#units').val();
			//console.log('NOTE:Testing| MyAccount>FitProfile.Views.js>updateAllowanceLookup>selectedUnit>',selectedUnit);
			_.each(lookUpTable,function(element,index,list){
				if(selectedUnit==='Inches'){
					//console.log('NOTE:Testing| converting cm value to inch ',list[index].value);
					list[index].value = (list[index].value * 0.39).toFixed(1);
					//console.log('NOTE:Testing| converted cm value to inch ',list[index].value);
				}
			});
			//console.log('NOTE:Testing| MyAccount>FitProfile.Views.js>updateAllowanceLookup>New lookUpTable>',lookUpTable);

			jQuery(".allowance-fld").each(function () {
				var id = jQuery(this).prop("id").split("_")[1]
					, lookUpValue = _.where(lookUpTable, { field: id })
					, finalMeasure = 0;

				if (lookUpValue && lookUpValue.length) {
					jQuery(this).data("baseval", lookUpValue[0].value);

					if (jQuery("#" + id).val() !== "") {
						jQuery(this).val(lookUpValue[0].value);
					} else {
						jQuery(this).val("0");
					}
				} else {
					//jQuery(this).data("baseval", 0);
					jQuery(this).val("0");
				}

				jQuery(this).trigger('change');
			});
		}


		, submitProfile: function (e) {
			e.preventDefault();
			var range = {
				"Neck": { min: 31, max: 59 },

				"Shoulder": { min: 37, max: 67 },

				"Chest": { min: 86, max: 184 },

				"Waist": { min: 76, max: 182 },

				"Hips": { min: 82, max: 184 },

				"Upperarm": { min: 32, max: 60 },

				"Sleeve-Left": { min: 52, max: 79 },

				"Sleeve-Right": { min: 52, max: 79 },

				"Cuff-Left": { min: 21, max: 33 },

				"Cuff-Right": { min: 21, max: 33 },

				"Back-Length": { min: 67, max: 95 }
			};
			var finishMeasurements = jQuery('#profile-form span[id*="finish_"]');
			var measureTypeValue = jQuery("#in-modal-custrecord_fp_measure_type").val() ?
				jQuery("#in-modal-custrecord_fp_measure_type").val() : jQuery("#custrecord_fp_measure_type").val();
			var hasErrors = false;
			for (var i = 0; i < finishMeasurements.length; i++) {
				if (finishMeasurements[i].attributes['min-value'] && finishMeasurements[i].attributes['max-value']) {
					var min = parseFloat(finishMeasurements[i].attributes['min-value'].value),
						max = parseFloat(finishMeasurements[i].attributes['max-value'].value),
						finalvalue = parseFloat(finishMeasurements[i].innerHTML);
					if (min && max) {
						if (min > finalvalue || finalvalue > max) {
							hasErrors = true;
							break;
						}
					}
				}
			};
			if (hasErrors) {
				//alert('Body measurements finished value is not within the range.');
				noty({
					text: 'Body measurements finished value is not within the range.',
					type: 'error',
					layout: 'center',
					//theme: 'relax',
					timeout: 5000
				});
				return false;
			}
			if (measureTypeValue == 'Block') {

				if (jQuery('#body-fit').val() == 'Select' || !jQuery('#body-fit').val()) {

					//alert(_('Please enter Fit Value').translate());
					noty({
						text: 'Please enter Fit Value',
						type: 'error',
						layout: 'center',
						//theme: 'relax',
						timeout: 5000
					});
					return false;

				}

				if (jQuery('#body-block').val() == 'Select' || !jQuery('#body-block').val()) {

					//alert(_('Please enter Block Value').translate());
					noty({
						text: 'Please enter Block Value',
						type: 'error',
						layout: 'center',
						//theme: 'relax',
						timeout: 5000
					});
					return false;

				}

			}
			var regex = new RegExp("\\+","g");
			var formValues = jQuery(e.target).serialize().split("&")
				, self = this
				, dataToSend = new Array()
				, measurementValues = new Array();

			this.model.set("name", jQuery("#name").val());
			this.model.set("custrecord_fp_product_type", jQuery("#custrecord_fp_product_type").val());
			this.model.set("custrecord_fp_measure_type", jQuery("#custrecord_fp_measure_type").val());

			if (!this.model.validate()) {
				_.each(formValues, function (formValue) {
					var field = formValue.split("=")[0]
						, value = formValue.split("=")[1]
						, formData = new Object()
						, param = new Object();

					if (field == "custrecord_fp_client" || field == "name" || field == "custrecord_fp_product_type"
					|| field == "custrecord_fp_measure_type") {
						formData.name = field;
						if (field == "custrecord_fp_client" || field == "name") {
							formData.value = value.replace(regex, " ");
						} else {
							formData.text = value.replace(regex, " ");
						}
						formData.type = "field";
						formData.sublist = "";

						dataToSend.push(formData);
					} else {
						var measureData = new Object();
						measureData.name = field;
						measureData.value = value.replace(regex, " ");
						console.log(measureData);
						measurementValues.push(measureData);
					}
				});

				//console.log('MyAccount>FitProfile.Views.js>measurementValues>',measurementValues);

				var param = new Object();
				dataToSend.push({ "name": "custrecord_fp_measure_value", "value": JSON.stringify(measurementValues), "type": "field", "sublist": "" })
				param.type = self.fitprofile.get("current_profile") ? "update_profile" : "create_profile";
				if (self.fitprofile.get("current_profile")) {
					param.id = self.fitprofile.get("current_profile");
				}

				param.data = JSON.stringify(dataToSend);
				console.log(dataToSend);
				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "POST", param).always(function (data) {
					var newRec = JSON.parse(data.responseText);
					if (data.status) {
						self.fitprofile.set("current_profile", null);
						self.fitprofile.set("current_client", null);
						//self.options.application.getLayout().currentView.showContent()

						// Test issue #88
						self.options.application.getLayout().currentView.displayProfiles(JSON.parse(data.responseText), self.id, false);
					}
				});
			}
		}
	});

	return Views;
});
