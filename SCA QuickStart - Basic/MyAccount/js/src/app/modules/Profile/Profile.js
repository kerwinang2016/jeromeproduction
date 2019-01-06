// Profile.js
// -----------------
// Defines the Profile module (Collection, Views, Router)
// As the profile is instanciated in the application (without definining a model)
// the validation is configured here in the mountToApp
define('Profile', ['Profile.Views','Profile.Router','User.Model'], function (Views, Router, UserModel)
{
	'use strict';

	return	{

		Views: Views
	,	Router: Router
	,	MenuItems: [
			{
				id: 'home'
			,	name: _('Overview').translate()
			,	url: 'overview'
			,	index: 0
			}
		,{
				id: 'stocklist'
			,	name: _('Stock List').translate()
			,	url: 'stocklist'
			,	index: 7
			}
		,{
				id: 'termsandconditions'
			,	name: _('Terms and Conditions').translate()
			, url: 'termsandconditions'
			,	index: 8
			}
		,{
				id: 'contactus'
			,	name: _('Contact Us').translate()
			, url: 'contactus'
			,	index: 9
			}
		,	{
				id: 'settings'
			,	name: _('Settings').translate()
			,	index: 4
			,	children:
				[
					{
						id: 'profileinformation'
					,	name: _('Profile Information').translate()
					,	url: 'profileinformation'
					,	index: 1
					}
				,	{
						id: 'emailpreferences'
					,	name: _('Email Preferences').translate()
					,	url: 'emailpreferences'
					,	index: 2
					}
				,	{
						id: 'updateyourpassword'
					,	name: _('Update Your Password').translate()
					,	url: 'updateyourpassword'
					,	index: 5
					}
				,	{
						id: 'designoptionsrestriction'
					,	name: _('Design Options Restriction').translate()
					,	url: 'designoptionsrestriction'
					,	index: 6
					}
				,	{
						id: 'favouriteoptions'
					,	name: _('Favourite Options').translate()
					,	url: 'favouriteoptions'
					,	index: 7
					}
				]
			}
		]

	,	mountToApp: function (application)
		{
			var Layout = application.getLayout();

			jQuery.ajax({
				url: _.getAbsoluteUrl('js/DesignOptions_Config.json'),
				async: false,
				success: function(data){
					window.design_options = data
				},
			});

			application.UserModel = UserModel.extend({
				urlRoot: 'services/profile.ss'
			});

			application.getUser().on('change:name change:lastname change:companyname', function ()
			{
				Layout.updateHeader();
			});

			return new Router(application);
		}
	};
});
