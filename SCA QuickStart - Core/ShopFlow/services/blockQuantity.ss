/*exported service*/
// ----------------
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		var method = request.getMethod();

		switch (method)
		{
			case 'GET':
				var columns = [], items = [], filters=[];
				columns.push(new nlobjSearchColumn('internalid'));
				columns.push(new nlobjSearchColumn('custrecord_bqm_block'));
				columns.push(new nlobjSearchColumn('custrecord_bqm_product'));
				columns.push(new nlobjSearchColumn('custrecord_bqm_quantity'));
				filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
				var search = nlapiCreateSearch('customrecord_block_quantity_measurement',filters,columns);
				var resultSet = search.runSearch();
				var searchid = 0;
				var res,cols;
				do{
					res = resultSet.getResults(searchid,searchid+1000);
					if(res && res.length > 0){
						if(!cols)
						cols = res[0].getAllColumns();
						for(var i=0; i<res.length; i++){
							var itemdata = {};
							for(var j=0; j<cols.length; j++){
								var jointext= cols[j].join?cols[j].join+"_":'';
								itemdata[jointext+cols[j].name] = res[i].getValue(cols[j]);
								if(res[i].getText(cols[j]))
								itemdata[jointext+cols[j].name+"text"] = res[i].getText(cols[j]);
							}
							items.push(itemdata);
						}
						searchid+=1000;
					}
				}while(res && res.length == 1000);
				Application.sendContent(items);
			break;

			default:
				// methodNotAllowedError is defined in ssp library commons.js
				Application.sendError(methodNotAllowedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}
