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
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
       user: 'zozulyaevgeny1995@gmail.com',
       pass: 'Urgo1995!'
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

  // newOrder.orderDate = 

  // let exactDate = new Date();
  // exactDate.setDate(exactDate.getDate() + Math.abs(this.currentWeekDay - this.obj.index));
  // this.currentCalendatDay = 'на ' + exactDate.getDate().toString() + '.' + ( exactDate.getMonth() + 1 );

  if(newOrder.chosenDay == newOrder.currentDay){

    let exactDate = new Date();
    const _day = exactDate.getDate() < 10 ? '0' + exactDate.getDate() : exactDate.getDate();
    const _month = (exactDate.getMonth() + 1) < 10 ? '0' + (exactDate.getMonth() + 1) : exactDate.getMonth() + 1;
    newOrder.orderDate =  _day + '.' + _month;
    
  }else{
    let currentWeekDay = new Date();
    currentWeekDay = currentWeekDay.getDay();

    let exactDate = new Date();
    exactDate.setDate(exactDate.getDate() + Math.abs(currentWeekDay - newOrder.chosenDay));
    newOrder.orderDate = exactDate.getDate().toString() + '.' + ( exactDate.getMonth() + 1 );
  }

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

app.delete("/api/orders/:id", function(req, res){
  
  const id = new objectId(req.params.id);
  console.log(`DELETE: ${id}`);
  const collection = req.app.locals.collection;
  collection.findOneAndDelete({_id: id}, function(err, result){
             
      if(err) return console.log(err);    
      let order = result.value;
      res.send(order);
  });
});


// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", () => {
  dbClient.close();
  process.exit();
});