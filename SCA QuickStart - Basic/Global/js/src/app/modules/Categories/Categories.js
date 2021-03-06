// Categories.js
// -------------
// Utility Class to handle the Categories tree 
define('Categories', function ()
{
	'use strict';
	
	return {
		
		tree: {}
		
		// Categories.reset: 
		// Refreshes the tree
	,	reset: function (tree)
		{
			this.tree = tree;
		}
	
		// Categories.getTree: 
		// Returns a deep copy of the category tree
	,	getTree: function ()
		{
			return jQuery.extend(true, {}, this.tree);
		}
		
		// Categories.getBranchLineFromPath:
		// given a path retuns the branch that fullfil that path,
	,	getBranchLineFromPath: function (path)
		{
			var tokens = path && path.split('/') || [];

			if (tokens.length && tokens[0] === '')
			{
				tokens.shift();
			}
			
			return this.getBranchLineFromArray(tokens);
		}
		
		// Categories.getBranchLineFromArray:
		// given an array of categories it retuns the branch that fullfil that array.
		// Array will be walked from start to bottom and the expectation is that its in the correct order
	,	getBranchLineFromArray: function (array)
		{
			var branch = []
			,	slice = {categories: this.tree};
			
			for (var i = 0; i < array.length; i++)
			{
				var current_token = array[i];
				
				if (slice.categories && slice.categories[current_token])
				{
					branch.push(slice.categories[current_token]);
					slice = slice.categories[current_token];
				}
				else
				{
					break;
				}
			}
			
			return branch;
		}
		
		// Categories.getTopLevelCategoriesUrlComponent
		// returns the id of the top level categories
	,	getTopLevelCategoriesUrlComponent: function ()
		{
			return _.pluck(_.values(this.tree), 'urlcomponent');
		}	

	,	makeNavigationTab: function (categories, memo)
		{
			var result = []
			,	self = this;

			_.each(categories, function (category)
			{
				var href = (memo ? memo + '/' : '') + category.urlcomponent

				,	tab = {
						href: '/' + href
					,	text: category.itemid
					,	data: 
						{
							hashtag: '#' + href
						,	touchpoint: 'home'
						}
					};

				if (category.categories)
				{
					tab.categories = self.makeNavigationTab(category.categories, href);
				}

				result.push(tab);
			});

			return result;
		}

        /**
         * @param application
         * @param method "prepend", "append" or integer index to splice into
         */
	,	addToNavigationTabs: function (application, method)
		{
			var tabs = this.makeNavigationTab(this.getTree());

            if(!method) {
                method = 'prepend';
            }
            var originalTabs = application.Configuration.navigationTabs,
                navigationTabs;
            switch(method) {
                case 'prepend': {
                    navigationTabs = _.union(tabs, originalTabs);
                    break;
                }
                case 'append': {
                    navigationTabs = _.union(originalTabs, tabs);
                    break;
                }
                default: {
                    navigationTabs = originalTabs;
                    if(typeof method == "number") {
                        Array.prototype.splice.apply(navigationTabs, [method, 0].concat(tabs));
                    }
                    break;
                }
            }

			application.Configuration.navigationTabs = navigationTabs;

			return;
		}

	,	mountToApp: function (application, options)
		{
			if (options && options.addToNavigationTabs)
			{
				//this.addToNavigationTabs(application, options.navigationAddMethod);
			}
		}
	};
});