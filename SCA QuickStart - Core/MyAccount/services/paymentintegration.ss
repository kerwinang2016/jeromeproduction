function service (request)
{
  'use strict';
  var data = JSON.parse(request.getBody() || '{}');
  var method = request.getMethod()
  switch (method)
  {
    case 'POST':
    //userid netsuite pwd Jerome1234!
      var paymenturl = 'https://paymentgateway.commbank.com.au/api/rest/version/46/merchant/JERCLOMCC201/session';
      var response = nlapiRequestURL(paymenturl,JSON.stringify(data), {'Authorization':'Basic bWVyY2hhbnQuSkVSQ0xPTUNDMjAxOjhhYjUzNmQ2MjM0NDdhNzg0NmZiYjUzYzVhZDEyODFm'});
      Application.sendContent(response.getBody());
      break;
    default:
  }
}
