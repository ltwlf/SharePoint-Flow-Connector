var helper = require('../helper');
var request = require('request');

module.exports = function (context, req) {
    context.log('GetSiteGroups HTTP trigger function processed a request.');
    var help = new helper(context);
    var token = help.authorize();
    var webUrl = req.query.webUrl || (function(){help.returnError(400, "Parameter webUrl is required!");return;})();
    var options = {
        url: webUrl + "/_api/web/SiteGroups",
        headers: {
          'Accept': "application/json;odata=verbose",
          'Authorization': token
        }
    };
    request.get(options, function(error, response, body){
        if(response.statusCode != 200){
            help.returnError(response.statusCode, JSON.parse(body));
            return;
        }
        var groups = JSON.parse(body).d.results.map(group => {
            return {
                Id: group.Id,
                Title: group.Title,
                Description: group.Description
            };
        });
        context.res = {
            status: 200,
            body: groups
        };
        context.done();
    });
};