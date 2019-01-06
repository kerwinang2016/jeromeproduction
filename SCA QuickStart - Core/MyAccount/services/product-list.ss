/*exported service*/
// product-list.ss
// ----------------
// Service to manage product list requests
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		var method = request.getMethod()
		,	data = JSON.parse(request.getBody() || '{}')
		,	id = request.getParameter('internalid') || data.internalid
		,	ProductList = Application.getModel('ProductList');
		var customerid = request.getParameter('customerid');
		nlapiLogExecution('debug','REQUEST CUSTOMER', customerid)
		switch (method)
		{
			case 'GET':
				if (id)
				{
					if (id === 'later')
					{
						Application.sendContent(ProductList.getSavedForLaterProductList(customerid));
					}
					else
					{
						Application.sendContent(ProductList.get(id,customerid));
					}
				}
				else
				{
					Application.sendContent(ProductList.search('name',customerid));
				}
			break;

			case 'POST':
				var internalid = ProductList.create(data,customerid);

				Application.sendContent(ProductList.get(internalid,customerid), {'status': 201});
			break;

			case 'PUT':
				ProductList.update(id, data, customerid);
				Application.sendContent(ProductList.get(id, customerid));
			break;

			case 'DELETE':
				ProductList.delete(id, customerid);
				Application.sendContent({'status': 'ok'});
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
