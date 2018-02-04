module.exports = function(ctx){
    var context = ctx;
    var req = context.req;
    this.authorize = function(){
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
        return token;
    };
    this.returnError = function(statusCode, message){
        context.log("Error: %s", message);
        context.res = {
            headers: {
                "Content-Type" : "application/json"
            },
            body: {
                error: message
            },
            statusCode: statusCode
        };
        context.done();
        return;
    };    
};