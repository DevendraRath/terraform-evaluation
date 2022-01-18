const AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-2",
 })

 const dynamodb = new AWS.DynamoDB.DocumentClient();
 const dynamodbTableName = "contacts";
 const contactsPath = '/contacts';
 const contactPath = '/contact';

 exports.handler = async function (event) {
     console.log('Request event: '. event);
     let response;
     switch(true){
         case event.httpMethod === 'GET' && event.path === contactsPath:
             response = await getContacts();
             break;
        case event.httpMethod === 'POST' && event.path === contactPath:
            response = await saveContacts(JSON.parse(event.body));
            break;
            default: 
            response = buildResponse(404, '404 Not Found');
     }
     return response;
 }

 async function getContacts() {
     const params = {
         TableName: dynamodbTableName
     }
     const allContacts = await scanDynamoRecords(params, []);
     const body = {
         contacts: allContacts
     }
     return buildResponse(200, body);
 }

 async function scanDynamoRecords(scanParams, itemArray) {
     try {
         const dynamoData = await dynamodb.scan(scanParams).promise();
         itemArray = itemArray.concat(dynamoData.Items);
         if(dynamoData.LastEvaluatedKey) {
             scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
             return await scanDynamoRecords(scanParams, itemArray);
         }
         return itemArray;
     } catch (error) {
         console.error('Do your custome error handling here, I am just gonna log it: ', error);
     }
 }

 async function saveContacts(requestBody){
     const params = {
         TableName: dynamodbTableName,
         Item: requestBody
     }
     return await dynamodb.put(params).promise().then(() => {
         const body = {
             Operation: 'SAVE',
             Message: 'SECCESS',
             Item: requestBody
         }
         console.log(body);
         return buildResponse(200, body);
     }, (error) => {
        console.error('Do your custome error handling here, I am just gonna log it: ', error);
     } )
 }

 async function buildResponse(statusCode, body){
     return{
         statusCode: statusCode,
         headers: {
             'Content-Type': 'application/json'
         },
         body: JSON.stringify(body)
     }
 }