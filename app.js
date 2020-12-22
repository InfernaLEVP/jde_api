const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;

const mongoClient = new MongoClient("mongodb://localhost:27017/", { useNewUrlParser: true });

let dbClient;


const cors = require('cors');

const app = express();

app.use(cors());

const jsonParser = express.json();
var transporter = nodemailer.createTransport(smtpTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
       user: 'urgo1995@mail.ru',
       pass: 'allwormoffargyst1Q2'
    },
    tls:{
        rejectUnauthorized: false
    }
  }));

app.use(express.static(__dirname + "/static"));
 
mongoClient.connect(function(err, client){
    if(err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("usersdb").collection("orders");
    app.listen(3000, function(){
        console.log("Сервер ожидает подключения...");
    });
});

app.get("/", function(request, response){
     
    response.send("<h2>Привет Express!</h2>");
});

app.post("/api/orders", jsonParser, (request, response) => {
  console.log(request.body);
  const newOrder = request.body;
  newOrder.verified = 0;

  // #region Send EMAIL
  const message = {
      from: 'urgo1995@mail.ru', // Sender address
      to: 'letalstr1ke@yandex.ru',         // List of recipients
      subject: 'Заказ c JDE.BEST', // Subject line
      text: `Phone: ${newOrder.phoneInput} . Count: ${newOrder.count} . Name: ${newOrder.searchName} . Address: ${newOrder.clientAdress} . ChosenDay: ${newOrder.chosenDay} . CurrentDay: ${newOrder.currentDay} . Comment : ${newOrder.comment}` // Plain text body
  };
  transporter.sendMail(message, function(err, info) {
      if (err) {
        console.log(err)
      } else {
        console.log(info);
      }
  });
  //#endregion

  if(!request.body) return response.sendStatus(400);
  
  //#region put order to DB
  const collection = request.app.locals.collection;
  
  collection.insertOne(newOrder, function(err, result){
              
    if(err) return console.log(err);
    response.send(newOrder);
  });
  //#endregion

    //response.json(request.body); // отправляем пришедший ответ обратно
});

app.get("/api/orders", function(req, res){
        
  const collection = req.app.locals.collection;
  collection.find({}).toArray(function(err, users){
       
      if(err) return console.log(err);
      res.send(users)
  });
   
});

app.put("/api/orders", jsonParser, function(req, res){
        
  if(!req.body) return res.sendStatus(400);
  const id = new objectId(req.body.id);
  const verified = req.body.verified;
     
  const collection = req.app.locals.collection;
  collection.findOneAndUpdate({_id: id}, { $set: {verified: verified}},
       {returnOriginal: false },function(err, result){
             
      if(err) return console.log(err);     
      const order = result.value;
      res.send(order);
  });
});


// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", () => {
  dbClient.close();
  process.exit();
});