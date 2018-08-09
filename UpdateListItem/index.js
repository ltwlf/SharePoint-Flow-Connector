var request = require("request");

module.exports = function (context, req) {

    context.log('UpdateListItem HTTP trigger is processing a request...');
    context.log.verbose("Headers: %j", context.req.headers);

    var token = req.headers.authorization || req.headers["x-ms-token-aad-access-token"] || null;

    if(typeof token == 'undefined'){
        context.log('End processing because no access token was found.');
        context.res = {
            status: 401, 
            body: "Unauthorized: No access token!"
        };
        context.done();
        return;
    }

    if(!token.toLowerCase().startsWith("bearer")) token += "Bearer ";

    var webUrl = req.query.webUrl || null;
    var listName = req.query.listName || null;
    var query = req.query.query || "";
    var id = req.query.id || null;

    context.log('Query parameters: webUrl: "%s" listName: "%s"  id: "%s"', webUrl, listName, id);

    if(webUrl == null || listName == null || id == null){
        context.res = {
            status: 400,
            body: "Query parameters webUrl, listName and id are required."
        };
        context.done();
        return;
    }

    var restUrl = webUrl + "/_api/web/Lists/GetByTitle('" + listName + "')/GetItemById(" + id + ")";

    var options = {
        url: restUrl,
        headers: {
          'Content-Type': "application/json;odata=verbose",
          'Accept': "application/json;odata=verbose",
          'Authorization': token,
          'If-Match': '*'
        },
        body: context.req.body
      };

    
    var resp = request.patch(options, function(error, response, body){
        
        context.log.verbose("SharePoint Response: %j", response);
        if(response.statusCode != 200 && response.statusCode != 204 || error != null)
        {
            if(response.statusCode == 401)
            {
                context.res = {
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: {
                        error: "Unauthorized"
                    },
                    statusCode: response.statusCode
                };
                context.done();
                return;
            }

            if(response.statusCode == 404)
            {
                context.res = {
                    headers: {
                        "Content-Type" : "application/json"
                    },
                    body: {
                        error: "Not found"
                    },
                    statusCode: response.statusCode
                };
                context.done();
                return;
            }

            context.log("SharePoint Error: %j", response);
            context.res = {
                headers: {
                    "Content-Type" : "application/json"
                },
                body: {
                    error: JSON.parse(body).error.message.value
                },
                statusCode: response.statusCode
            };
            context.done();
            return;
        }
        else
        {
            context.done();
        }
    });


};