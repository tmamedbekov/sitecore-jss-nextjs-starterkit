exports.handler = async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify(event),
  };
};

/*
`event` object
{
    "path": "Path parameter",
    "httpMethod": "Incoming request's method name"
    "headers": {Incoming request headers}
    "queryStringParameters": {query string parameters }
    "body": "A JSON string of the request payload."
    "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"
}
*/
