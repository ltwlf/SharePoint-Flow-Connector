var request = require("request");
var jsonSchemaGenerator = require("json-schema-generator");

module.exports = function (context, req) {

    context.log('GetListItems HTTP trigger is processing a request...');
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
    var schema = req.params.schema != null;

    context.log('Query parameters: webUrl: "%s" listName: "%s" query: "%s" schema: "%s"', webUrl, listName, query, schema);

    if(webUrl == null || listName == null){
        context.res = {
            status: 400,
            body: "Query parameters webUrl and listTitle are required."
        };
        context.done();
        return;
    }

    var restUrl = webUrl + "/_api/web/Lists/GetByTitle('" + listName + "')/items?" + query;

    var options = {
        url: restUrl,
        headers: {
          'Accept': "application/json;odata=verbose",
          'Authorization': token
        }
      };

    var resp = request.get(options, function(error, response, body){
        
        context.log.verbose("SharePoint Response: %j", response);
        if(response.statusCode != 200)
        {
            context.log("SharePoint Error: %j", response);
            context.res = {
                headers: {
                    "Content-Type" : "application/json"
                },
                body: {
                    error: JSON.stringify(response)
                },
                statusCode: response.statusCode
            };
            context.done();
            return;
        }
        
        context.log("Processing SharePoint response...");
        var jsonResult = JSON.parse(body);
        var items = jsonResult.d.results.map(item => {
            delete item.__metadata;
            return item;
        });
        context.log.verbose("Processed Json Result: %j", jsonResult);

        if(schema==true){
            context.log("Generate Json Schema.");
            var jsonSchema = jsonSchemaGenerator(items);
            context.res = {
                headers: {
                    "Content-Type" : "application/json"
                },
                body: {
                    schema: jsonSchema
                }
            };
        }
        else
        {
            context.res = {
                headers: {
                    "Content-Type" : "application/json"
                },
                body: items
            };
        }
        context.log('GetListItems HTTP trigger successfully finished.');
        context.done();
    });
};