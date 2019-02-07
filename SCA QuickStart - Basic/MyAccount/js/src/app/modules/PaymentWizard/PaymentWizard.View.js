// OrderWizzard.View.js
// --------------------
//
define('PaymentWizard.View', ['Wizard.View'], function (WizardView)
{
	'use strict';

	return WizardView.extend({

			template: 'payment_wizard_layout'

		,	bodyClass: 'force-hide-side-nav'

	  ,  initialize: function ()
	      {
	          WizardView.prototype.initialize.apply(this, arguments);
	          this.title = _('Make a Payment').translate();
						var scripts = document.getElementById('payment-integration');
						if(!scripts){
						var script = document.createElement('script');
						script.type = 'text/javascript';
						script.src = 'https://paymentgateway.commbank.com.au/checkout/version/46/checkout.js'
						script.setAttribute("data-error",'errorCallback');
						script.setAttribute("data-cancel",'cancelCallback');
						script.setAttribute("data-complete","completeCallback");
						document.getElementsByTagName('head')[0].appendChild(script);
						}

	      }

		, events:{
			'click [data-action="submit-paymentgateway"]': 'submitPayment'
		}

		,	submitPayment:function(){

			var self = this;
			var descriptions ="";
			var invoiceids = "";
			var items = [];
			for(var i=0;i<this.wizard.model.getSelectedInvoices().length;i++){
				var curr_invoice = this.wizard.model.getSelectedInvoices().models[i];
				if(descriptions) descriptions += " "
				descriptions +=  curr_invoice.get('tranid');
				invoiceids += "_"+curr_invoice.get('internalid');
				items.push({name:curr_invoice.get('tranid'), quantity:1, unitPrice: curr_invoice.get('amount')})
			}
			var a = new Date();
			var orderid = SC.ENVIRONMENT.customer_internalid+"_"+a.getTime();
			var data = {'apiOperation':'CREATE_CHECKOUT_SESSION','order':{'currency':SC.ENVIRONMENT.currentCurrency.code,'id':orderid,'amount':self.model.get('invoices_total')}}

			jQuery.ajax({
			    url: _.getAbsoluteUrl('services/paymentintegration.ss'),
			    type: 'post',
			    data: data,
			    dataType: 'json',
			    success: function (d) {
						if(d.result == "ERROR"){
						}else{
						Checkout.configure({
								merchant: 'JERCLOMCC201',
								session:{
									id: d.session.id
								},
								order: {
										amount: self.model.get('payment'),
										currency: SC.ENVIRONMENT.currentCurrency.code,
										description: 'Payment for Invoices',
									 	id: orderid,
										item: items
								},
								interaction: {
										merchant: {
												name: 'Jerome Clothiers Pty Ltd',
												address: {
														line1: '4 Chester Place',
														line2: 'Bundoora VIC 3083',
														line3: 'Australia'
												},
												email: 'contact@jeromeclothiers.com'
										}
								}
						});
						Checkout.showLightbox();
					}
			  }
			});
		}
    ,	showContent: function()
		{
			var Layout = this.options.application.getLayout();
			WizardView.prototype.showContent.apply(this, arguments).done(function()
			{
				Layout.hideBreadcrumb();
			});
		}
	});
});
function errorCallback(){
};
function cancelCallback(){
}
function completeCallback(){
	jQuery('[data-action="submit-step"]').click()
}
