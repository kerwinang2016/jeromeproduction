// Profile.Views.js
// -----------------------
// Views for profile's operations
define('FitProFile.Views', ['Client.Model', 'Profile.Model', 'Profile.Collection'], function (ClientModel, ProfileModel, ProfileCollection) {
	'use strict';

	var Views = {};

	// home page view
	Views.Client = Backbone.View.extend({

		template: 'fit_profile'
		, title: _('Tailor Client').translate()
		, attributes: { 'class': 'TailorClientView' }
		, events: {
			'change select#clients-options': 'getFitProfile'
			, 'click [data-action=remove-rec]': 'removeRec'
			, 'click [data-action=copy-profile]': 'copyProfile'
			, 'click [id=swx-order-client-search]': 'swxOrderClientSearch'
			, 'click [id=swx-order-client-add]': 'swxOrderClientAdd'
		}
		, initialize: function (options) {
			this.model = options.model;
			this.application = options.application;
			SC.clients = options.clients;

			this.model.set('swx_order_client_name', '');
			this.model.set('swx_order_client_email', '');
			this.model.set('swx_order_client_phone', '');

		}

		, showContent: function () {
			var self = this;
			this.application.getLayout().showContent(this, 'tailorclient', []);

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
			var self = this;
			jQuery("div[data-type='alert-placeholder']").empty();
			//var clientModel = this.model.get('current_client')
			var param = new Object();
			param.type = "get_client";
			var tailor = SC.Application('Shopping').getUser().get('parent')!= null? SC.Application('Shopping').getUser().get('parent'):SC.Application('Shopping').getUser().id;
			param.data = JSON.stringify({filters: ["custrecord_tc_tailor||anyof|list|"+tailor], columns: ["internalid", "custrecord_tc_first_name", "custrecord_tc_last_name", "custrecord_tc_email", "custrecord_tc_addr1", "custrecord_tc_addr2", "custrecord_tc_country", "custrecord_tc_city", "custrecord_tc_state", "custrecord_tc_zip", "custrecord_tc_phone"]});
			jQuery.get(_.getAbsoluteUrl('services/fitprofile.ss'), param).always(function(data){
				if(data){
					self.model.client_collection.reset();
					self.model.client_collection.add(data);


					$("[id='order-history']").empty();
					var clientCollection = self.model.client_collection
					var stClientCollection = JSON.stringify(clientCollection);
					var arrObjClientCollection = (!_.isNullOrEmpty(stClientCollection)) ? JSON.parse(stClientCollection) : [];
					self.model.set('swx_order_client_name', self.$('input[name=swx-order-client-name]').val());
					self.model.set('swx_order_client_email', self.$('input[name=swx-order-client-email]').val());
					self.model.set('swx_order_client_phone', self.$('input[name=swx-order-client-phone]').val());
					self.model.set('swx_is_display_client_details', '');

					var objFilters = {};
					objFilters['name'] = self.model.get('swx_order_client_name');
					objFilters['email'] = self.model.get('swx_order_client_email');
					objFilters['phone'] = self.model.get('swx_order_client_phone');

					var arrObjClient = _.getArrObjOrderClientList(arrObjClientCollection, objFilters)


					var arrObjClientList = [];
					$("#swx-order-client-list").empty();
					$("#swx-order-client-list").html(SC.macros.swxOrderClientList(arrObjClient));

					_.toggleMobileNavButt();
				}
			});

		}

		, swxOrderClientAdd: function (e) {
			var $ = jQuery;
			$("#swx-order-clients-add-href").click();
		}


		, getFitProfile: function (e) {
			var clientID = jQuery(e.target).val();
			var self = this;
			this.model.set("current_client", clientID);

			this.model.on("afterProfileFetch", function () {
				jQuery("#fit-profile").html(SC.macros.fitProfileOptionDropdown(self.model.profile_collection, clientID));

				var profileView = new Views.Profile({
					model: new ProfileModel()
					, application: self.application
					, fitprofile: self.model
				});


				profileView.render();
				jQuery("#profile-section").html(profileView.$el);
			});

			if (clientID) {
				jQuery("#tailorclient-form .form-actions").html("<a class='btn' data-toggle='show-in-modal' href='/tailorclientdetails/new|client|" + this.application.getUser().get("internalid") + "'>Add</a> <a class='btn' data-toggle='show-in-modal' href='/tailorclientdetails/" + clientID + "|client'>Edit</a> <a class='btn' data-action='remove-rec' data-type='client' data-id='" + clientID + "'>Remove</a> <a class='btn btn-primary' data-hashtag='#/item-types?client=" + clientID + "' data-touchpoint='home' href='/item-types?client=" + clientID + "'>Create Order</a>");
			} else {
				jQuery("#tailorclient-form .form-actions").html("<a class='btn' data-toggle='show-in-modal' href='/tailorclientdetails/new|client|" + this.application.getUser().get("internalid") + "'>Add</a>");
				this.resetForm()
			}
		}

		, removeRec: function (e) {
			e.preventDefault();

			// April CSD Issue #036
			var message = _("Are you sure that you want to delete this client and their fit profiles?").translate();

			if (window.confirm(message)) {
				var selector = jQuery(e.target)
					, id = selector.data("id")
					, type = selector.data("type")
					, self = this;

				this.model.removeRec(type, id);
				this.model.on("afterRemoveRec", function () {
					self.model.set("current_client", null);
					self.showContent();
				});
			}
		}

		, resetForm: function () {
			jQuery("#fit-profile").html("");
			jQuery("#profile-section").html("");
		}
	});

	Views.ProfileSelector = Backbone.View.extend({
		template: 'profile_selector'
		, initialize: function (options) {
			this.application = options.application;
			this.model = options.model;
			this.types = options.types;

			window.currentFitProfile = this.model;
		}

		, events: {
			'change select.profiles-options': 'getProfileDetails'
			, 'click [data-action=remove-rec]': 'removeRec'
		}

		, render: function () {
			var self = this;
			self.groupProfile = new Array();
			if (self.model.profile_collection && self.types && self.types[0] != "&nbsp;") {
				_.each(self.types, function (type) {
					var profileObj = new Object()
						, profileArr = new Array();

					type = type.replace(" ", "");
					self.model.profile_collection.each(function (profile) {
						if (profile.get('custrecord_fp_product_type') == type) {
							profileArr.push(profile);
						}
					});

					profileObj.profile_type = type;
					profileObj.profiles = profileArr;

					self.groupProfile.push(profileObj);
				});

				this._render();
			}
		}

		, getProfileDetails: function (e) {
			var profileID = jQuery(e.target).val();
			var self = this;
			this.model.set("current_profile", profileID);

			if (profileID) {
				jQuery("#profile-actions-" + jQuery(e.target).data("type")).html("<a data-toggle='show-in-modal' href='/fitprofile/new'>Add</a> | <a data-toggle='show-in-modal' href='/fitprofile/" + profileID + "'>Edit</a> | <a data-action='remove-rec' data-type='profile' data-id='" + profileID + "'>Remove</a>");
			} else {
				jQuery("#profile-actions-" + jQuery(e.target).data("type")).html("<a data-toggle='show-in-modal' href='/fitprofile/new'>Add</a>");
				jQuery("#profile-details").html(SC.macros.profileForm(self.model));
			}
		}

		, removeRec: function (e) {
			e.preventDefault();
			var message = _("Are you sure that you want to delete this client and their fit profiles?").translate();

			if (window.confirm(message)) {
				var selector = jQuery(e.target)
					, id = selector.data("id")
					, type = selector.data("type")
					, self = this;

				this.model.removeRec(type, id);
				this.model.on("afterRemoveRec", function () {
					self.model.set("current_client", null);
					for (var i = 0; i < window.tempFitProfile.length; i++) {
						if (window.tempFitProfile[i].value == id) {
							window.tempFitProfile[i].value = "";
						}
					}
					self.options.application.trigger('profileRefresh');
					//jQuery("#" + selector.context.parentNode.id).val();
				});
			}
		}
	});


	Views.Profile = Backbone.View.extend({
		template: 'profile'
		, title: _('Fit Profile').translate()
		, events: {
			'change select#in-modal-custrecord_fp_product_type': 'getMeasurementType',
			'change select#custrecord_fp_product_type': 'getMeasurementType'
			, 'change select#custrecord_fp_measure_type': 'buildMesureForm'
			// ,  'change select#body-fit': 'rebuildMeasureForm'
			, 'change .allowance-fld': 'updateFinalMeasure'
			, 'change .body-measure-fld': 'updateFinalMeasure'
			, 'change #fit': 'updateAllowanceLookup'
			, 'change #in-modal-fit': 'updateAllowanceLookup'
			, 'change .block-measurement-fld': 'disableCounterBlockField'
			, 'submit #in-modal-profile-form': 'submitProfile'
			, 'change [id="units"]': 'changedUnits'
			, 'change [id="in-modal-units"]': 'changedUnits',

		}

		, initialize: function (options) {
			this.model = options.model;
			this.fitprofile = options.fitprofile;
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

		, changedUnits: function (el) {
			var $ = jQuery;

			//var productType = jQuery('#in-modal-custrecord_fp_product_type').val();
			var productType = jQuery('#custrecord_fp_product_type').val();
			if(productType === undefined ){
				productType = jQuery('#in-modal-custrecord_fp_product_type').val();
			}
			var unit = jQuery('#units').val()?jQuery('#units').val():jQuery('#in-modal-units').val();

			var configUrl = unit === 'CM' ? 'js/itemRangeConfig.json' : 'js/itemRangeConfigInches.json';


			jQuery.get(_.getAbsoluteUrl(configUrl)).done(function (data) {
				var selectedMeasurementConfig = _.findWhere(JSON.parse(data), { type: productType });

				_.each(selectedMeasurementConfig.config, function (el) {
					var fiedlName = el.name;
					if (el.name === 'Sleeve L' || el.name === 'Sleeve R') {
						fiedlName = fiedlName.replace(' ', '-');
					}

					jQuery('#range_' + fiedlName).html('(' + el.min + '-' + el.max + ')');
					jQuery('#finish_' + fiedlName).attr('min-value', el.min);
					jQuery('#finish_' + fiedlName).attr('max-value', el.max);

					jQuery('#in-modal-range_' + fiedlName).html('(' + el.min + '-' + el.max + ')');
					jQuery('#in-modal-finish_' + fiedlName).attr('min-value', el.min);
					jQuery('#in-modal-finish_' + fiedlName).attr('max-value', el.max);

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

			jQuery('#in-modal-fit').trigger('change');
			jQuery('#fit').trigger('change');
		}

		, render: function () {

			//var selectedProfile = this.fitprofile.profile_collection.where({internalid: this.model})[0];
			//var selectedUnit = JSON.parse(selectedProfile.get('custrecord_fp_measure_value'))[0].value;

			var configUrl = 'js/itemRangeConfig.json';

			var self = this;
			var selectedUnit = "CM";
			if (this.fitprofile.get("current_profile") !== null) {
				var selectedProfile = this.fitprofile.profile_collection.where({ internalid: this.fitprofile.get("current_profile") })[0];
				selectedUnit = JSON.parse(selectedProfile.get('custrecord_fp_measure_value'))[0].value;
			}

			window.itemRangeConfig = window.cmConfig;
			if (selectedUnit === 'Inches' && (selectedUnit !== null || selectedUnit !== undefined)) {
				window.itemRangeConfig = window.inchConfig;
			}


			self._render();
			self.$("#profile-details").html(SC.macros.profileForm(self.fitprofile));
			//this._render();
			//this.$("#profile-details").html(SC.macros.profileForm(this.fitprofile));
		}

		, getMeasurementType: function (e) {
			var $ = jQuery;
			var itemType = jQuery(e.target).val()
				, self = this
				, selectedItemType = null
				, measurementType = null
				, profile = self.model.profile_collection && self.model.get("current_profile") ? self.model.profile_collection.where({ internalid: self.model.get("current_profile") })[0] : null;

			if(!itemType){
				itemtype = jQuery('#custrecord_fp_product_type').val();
			}
			if (itemType) {
				selectedItemType = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];
			}
			if (selectedItemType) {
				measurementType = _.pluck(selectedItemType.measurement, "type");
				if($("#measure-type").length == 0) {
					//it doesn't exist
					jQuery("#in-modal-measure-type").html(SC.macros.measureTypeDropdown(measurementType, profile ? profile.get("custrecord_fp_measure_type") : null));
					jQuery("#in-modal-measure-form").html("");
				}else{
					jQuery("#measure-type").html(SC.macros.measureTypeDropdown(measurementType, profile ? profile.get("custrecord_fp_measure_type") : null));
					jQuery("#measure-form").html("");
				}

			} else {
				jQuery("#in-modal-measure-type").html("");
				jQuery("#in-modal-measure-form").html("");
				jQuery("#measure-type").html("");
				jQuery("#measure-form").html("");
			}
		}

		, buildMesureForm: function (e) {
			var measureType = jQuery(e.target).val()
				//, itemType = jQuery("#in-modal-custrecord_fp_product_type").val()
				, itemType = jQuery("#custrecord_fp_product_type").val()
				, self = this
				, fieldsForm = null;

			if(itemType  === undefined){
				itemType  = jQuery("#in-modal-custrecord_fp_product_type").val();
			}

			if (measureType && itemType) {
				fieldsForm = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];
				fieldsForm = _.where(fieldsForm.measurement, { type: measureType })[0];
				self.processBlockFields(fieldsForm, 'Regular');
				self.fitprofile.selected_measurement = fieldsForm;
				jQuery("#in-modal-measure-form").html(SC.macros.measureForm(fieldsForm));
				jQuery("#measure-form").html(SC.macros.measureForm(fieldsForm));
			} else {
				jQuery("#in-modal-measure-form").html("");
				jQuery("#measure-form").html("");
			}


		}
		, rebuildMeasureForm: function (e) {
			var fitType = jQuery(e.target).val()
				, measureType = jQuery("#custrecord_fp_measure_type").val()
				, itemType = jQuery("#in-modal-custrecord_fp_product_type").val()
				, self = this
				, fieldsForm = null;

			if (measureType && itemType && fitType) {
				fieldsForm = _.where(self.fitprofile.measurement_config, { item_type: itemType })[0];
				fieldsForm = _.where(fieldsForm.measurement, { type: measureType })[0];
				self.processBlockFields(fieldsForm, fitType)

				self.fitprofile.selected_measurement = fieldsForm;

				jQuery("#in-modal-measure-form").html(SC.macros.measureForm(fieldsForm, [{ "name": "fit", "value": fitType }]));
			} else {
				jQuery("#in-modal-measure-form").html("");
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

		, disableCounterBlockField: function (e) {
			var currentField = jQuery(e.target)
				, counterField = currentField.prop("id").indexOf('-max') > -1 ? currentField.prop("id").replace('-max', '-min') : currentField.prop("id").replace('-min', '-max');

			if (counterField && currentField.val() != "0") {
				jQuery("#" + counterField).prop("disabled", true);
			} else {
				jQuery("#" + counterField).removeProp("disabled");
			}
		}

		, updateFinalMeasure: function (e) {
			var field = jQuery(e.target)
				, id = field.prop("id").indexOf("_") > -1 ? field.prop("id").split("_")[1] : field.prop("id")
				, isAllowance = field.prop("id").indexOf("_") > -1 ? true : false
				, isModal = field.prop("id").indexOf("modal") > -1 ? true : false
				, finalMeasure = 0
				, idAllowancePrefix = isModal ? "#in-modal-allowance_" : "#allowance_"
				, idPrefix = isModal ? "#in-modal-" : "#"
				, idFinishPrefix = isModal ? "#in-modal-finish_" : "#finish_"
				, id = isModal && !isAllowance ? field.prop("id").split("-modal-")[1] : id;

			if (jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val() && !jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val().length) {
				idAllowancePrefix = idAllowancePrefix.replace("in-modal-", "");
			}
			if (isAllowance) {
				if (_.isNaN(jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val()) || jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val() === "") {
					finalMeasure = 0 + parseFloat(field.val());
				} else {
					finalMeasure = parseFloat(jQuery("[id='" + idPrefix.replace('#', '') + id + "']").val()) + parseFloat(field.val());
				}
			} else {
				if (_.isNaN(jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val()) || jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val() === "") {
					finalMeasure = 0 + parseFloat(field.val());
				} else if (jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val() == 0) {
					var value = jQuery("#in-modal-fit").val() ? jQuery("#in-modal-fit").val() : jQuery("#fit").val()
						, self = this
						, lookUpTable = self.fitprofile.selected_measurement["lookup-value"][value]
						, name = jQuery(e.target).attr('name')
						, lookUpValue = _.where(lookUpTable, { field: name })
						, finalMeasure = 0
						, allowance = 0;
					if (lookUpValue[0]) { // Update allowance field if there is a lookup value provided that allowance is 0
						var selectedUnit = jQuery('#units').val();
						if(selectedUnit === 'Inches'){
							lookUpValue = (parseFloat(lookUpValue[0].value) / 2.54);
							if(lookUpValue>0){
								lookUpValue = (Math.floor(10 * lookUpValue) / 10).toFixed(1);
							}
							jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val(lookUpValue);
						}
						else{
						//jQuery(idAllowancePrefix + id).val(lookUpValue[0].value);
						jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val(lookUpValue[0].value);
						}
						//allowance = jQuery(idAllowancePrefix + id).val();
						allowance = jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val();
					}
					finalMeasure = parseFloat(allowance) + parseFloat(jQuery("[id='" + idPrefix.replace('#', '') + id + "']").val());
				} else {
					finalMeasure = parseFloat(jQuery("[id='" + idAllowancePrefix.replace('#', '') + id + "']").val()) + parseFloat(jQuery("[id='" + idPrefix.replace('#', '') + id + "']").val());

				}
			}

			if (!finalMeasure) finalMeasure = 0;
			//jQuery(idFinishPrefix + id).html(Math.round(finalMeasure * 100) / 100);
			jQuery("[id='" + idFinishPrefix.replace('#', '') + id+"']").html(Math.round(finalMeasure * 100) / 100);

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
									jQuery(idPrefix+keys[l]).val((parseFloat(setranges[index].set[keys[l]])/2.54).toFixed(1));
									jQuery(idPrefix+keys[l]).trigger('change');
									//}
								}else{
									//if(jQuery("#"+keys[l]).val() == 0 || jQuery("#"+keys[l]).val() == '' ){
									jQuery(idPrefix+keys[l]).val(setranges[index].set[keys[l]]);
									jQuery(idPrefix+keys[l]).trigger('change');
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
			//, lookUpTable = self.fitprofile.selected_measurement["lookup-value"][value];

			var selectedUnit = jQuery('#units').val();
			if(selectedUnit === undefined ){
				selectedUnit = jQuery('#in-modal-units').val();
			}
			_.each(lookUpTable, function (element, index, list) {
				if (selectedUnit === 'Inches') {
					list[index].value = (list[index].value * 0.39).toFixed(1);
				}
			});

			jQuery(".allowance-fld").each(function () {
				var id = jQuery(this).prop("id").split("_")[1]
					, lookUpValue = _.where(lookUpTable, { field: id })
					, finalMeasure = 0
					, modalId = 'in-modal-' + id;

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

				// id = jQuery(this).prop("id").split("_")[0] == 'in-modal-allowance' ? modalId : id;

				// if (lookUpValue && lookUpValue.length) {
				// 	jQuery(this).data("baseval", lookUpValue[0].value);

				// 	if (jQuery("#" + id).val() !== "") {
				// 		jQuery(this).val(lookUpValue[0].value);
				// 	} else {
				// 		jQuery(this).val("0");
				// 	}
				// } else {
				// 	jQuery(this).val("0");
				// }

				// jQuery(this).trigger('change');
			});
		}
		, submitProfile: function (e) {
			e.preventDefault();
			var finishMeasurements = jQuery('#in-modal-profile-form span[id*="finish_"]');

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
				this.showError(_('Body measurements finished value is not within the range.').translate());
				return false;
			}

			var formValues = jQuery(e.target).serializeArray()
				, self = this
				, dataToSend = new Array()
				, measurementValues = new Array()

				, profileNameValue = jQuery("#in-modal-name").val() ?
					jQuery("#in-modal-name").val() : jQuery("#name").val()
				, productTypeValue = jQuery("#in-modal-custrecord_fp_product_type").val() ?
					jQuery("#in-modal-custrecord_fp_product_type").val() : jQuery("#custrecord_fp_product_type").val()
				, measureTypeValue = jQuery("#in-modal-custrecord_fp_measure_type").val() ?
					jQuery("#in-modal-custrecord_fp_measure_type").val() : jQuery("#custrecord_fp_measure_type").val()

			if (measureTypeValue == 'Block') {
				var inmodal = e.target.elements.block.id.indexOf('in-modal') != -1 ? true : false;
				if (inmodal) {
					if (jQuery('#in-modal-body-fit').val() == 'Select' || !jQuery('#in-modal-body-fit').val()) {
						this.showError(_('Please enter Fit Value').translate());
						return false;
					}
					if (jQuery('#in-modal-body-block').val() == 'Select' || !jQuery('#in-modal-body-block').val()) {
						this.showError(_('Please enter Block Value').translate());
						return false;
					}
				}
				else {
					if (jQuery('#body-fit').val() == 'Select' || !jQuery('#body-fit').val()) {
						this.showError(_('Please enter Fit Value').translate());
						return false;
					}
					if (jQuery('#body-block').val() == 'Select' || !jQuery('#body-block').val()) {
						this.showError(_('Please enter Block Value').translate());
						return false;
					}
				}

			}
			this.model.set("name", jQuery("#in-modal-name").val());
			this.model.set("custrecord_fp_product_type", productTypeValue);
			this.model.set("custrecord_fp_measure_type", measureTypeValue);

			if (!this.model.validate()) {
				_.each(formValues, function (formValue) {

					var field = formValue.name
						, value = formValue.value
						, formData = new Object()
						, param = new Object();

					if (field == "custrecord_fp_client" || field == "name" || field == "custrecord_fp_product_type" || field == "custrecord_fp_measure_type") {
						formData.name = field;
						if (field == "custrecord_fp_client" || field == "name") {
							formData.value = value; //value.split(" ").join("+"); //value.replace("+", " ");
						} else {
							formData.text = value; //value.split(" ").join("+"); //value.replace("+", " ");
						}
						formData.type = "field";
						formData.sublist = "";

						dataToSend.push(formData);
					} else {
						var measureData = new Object();
						measureData.name = field;
						measureData.value = value; //value.split(" ").join("+"); //value.replace("+", " ");

						measurementValues.push(measureData);
					}
				});

				var param = new Object();
				dataToSend.push({ "name": "custrecord_fp_measure_value", "value": JSON.stringify(measurementValues), "type": "field", "sublist": "" })
				param.type = self.fitprofile.get("current_profile") ? "update_profile" : "create_profile";
				if (self.fitprofile.get("current_profile")) {
					param.id = self.fitprofile.get("current_profile");
				}
				param.data = JSON.stringify(dataToSend);

				_.requestUrl("customscript_ps_sl_set_scafieldset", "customdeploy_ps_sl_set_scafieldset", "POST", param).always(function (data) {
					var newRec = JSON.parse(data.responseText)
					if (data.status) {
						self.fitprofile.set("current_profile", null);
						jQuery('[data-dismiss=modal]').click();
						self.options.application.trigger('profileRefresh');
						if (!window.tempFitProfile) {
							window.tempFitProfile = new Array();
							for (var i = jQuery('#fitprofile-details select.profiles-options').length - 1; i >= 0; i--) {
								var elem = jQuery('#fitprofile-details select.profiles-options')[i];
								var type = jQuery(elem).attr('data-type');
								window.tempFitProfile.push({ name: type, value: jQuery(elem).val() });
							};
						}
						for (var i = 0; i < window.tempFitProfile.length; i++) {
							if (window.tempFitProfile[i].name == productTypeValue)
								window.tempFitProfile[i].value = newRec.id;
						}
						//profiles-options-Trouser profiles-options-Waistcoat
					}
				});
			}
		}
	});
	return Views;
});
