/* Appel de tous nos outils */
const express = require('express');
const expressApp = express();
const http = require('http').Server(expressApp);
/* USB detection module */
var usbDetect = require('usb-detection');
/* MongoDB instances*/
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost';
var devicesDBName = "myDevicesDB"
var devicesCollectionName ='USBDevices'

/* Start USB detection */
usbDetect.startMonitoring();


const path = require('path');

/* Ajout de express-ejs-layouts */
const ejsLayout = require('express-ejs-layouts');

/* Initialisation des variables */
const router = {
    isStarted: false
};

function start(callback) {
    if (router.isStarted === false) {
        init(function () {
            loadRoutes(function () {
                /* Lance le serveur web sur le port 3000 */
                http.listen(3000, function () {
                    console.log('Application is running on port 3000');
                    router.isStarted = true;
                    if (typeof callback != 'undefined') {
                        callback();
                    }
                });
            });
        });
    } else {
        console.log("Application already started");
        if (typeof callback != 'undefined') {
            callback();
        }
    }
}

function init(callback) {
    /* On s'assure que le serveur n'est vraiment pas démarré */
    router.isStarted = false;

    /* Ajout de express-ejs-layouts */
    expressApp.use(ejsLayout);

    /* J'utilise ici EJS comme moteur de template */
    expressApp.set('view engine', 'ejs');

    /* assets sera le répertoire où se trouverons nos fichiers côté client */
    expressApp.use(express.static(path.join(__dirname, 'assets')));

    /* views est défini comme notre dossier de vues par défaut */
    expressApp.set('views', path.join(__dirname, '/views/'));

    if (typeof callback != 'undefined') {
        callback();
    }
}

/* ROUTES */

function loadRoutes(callback) {
    expressApp.get('/', function (req, res) {
        res.render('homepage/index');
    })
    .get('/alldevices', function (req, res){
        var text;
        usbDetect.find(function(err, devices) {
        console.log(devices, err);
        res.render("homepage/alldevices", {devices: devices});
        });
    })
    .get('/displaydatabase', function(req, res){
        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            
            console.log("AllDatabase:Connected");
            var db = client.db(devicesDBName);
            var cursor = db.collection(devicesCollectionName).find();
            var documents = [];
            cursor.forEach(function(doc) {
                
                if (doc != null) {
                    documents.push(doc);
                }
            }, function(err){
                    client.close();
                    res.render("homepage/displaydatabase", {doc:documents});
               }
            );
        });
        
    })
    .get('/device', function(req, res){
        var idToFind = req.query.id;
        console.log(idToFind);
        var MongoObjectID = require("mongodb").ObjectID;
        var objToFind     = { _id: new MongoObjectID(idToFind) };
        
        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            
            console.log("Device:Connected");
            var db = client.db(devicesDBName);
            var documents = [];
            var cursor = db.collection(devicesCollectionName).findOne(objToFind, function(err, doc){
                if (err) throw err;
                if (doc != null) {
                    documents.push(doc);
                }
                res.render("homepage/device", {doc:documents, idToFind:idToFind});
            });
        });
    })
    .get('/insert', function(req, res){
        var pid = req.query.pId;
        var vid = req.query.vId;

        usbDetect.find(parseInt(vid,10), parseInt(pid, 10), function(err, devices) { console.log('find '+vid+' '+pid, devices, err);
            MongoClient.connect(url, function(err, client) {
                if (err) throw err;
                
                console.log("DBInsert:Connected");
                var db = client.db(devicesDBName);
                /* We use insertMany instead of insertOne here as the find function can retrieve one or more results*/
                db.collection(devicesCollectionName).insertMany(devices, function(err, rr) {
                    if (err) throw err;
            
                    console.log("Number of documents inserted: " + rr.insertedCount);
                    
                    res.render("homepage/dbinsert", {count:rr.insertedCount});
                    client.close();
                });
            });
        });
    })
    .get('/insertallintodatabase', function(req, res){
        var text;
        
        usbDetect.startMonitoring();
        usbDetect.find(function(err, devices) {
            MongoClient.connect(url, function(err, client) {
                if (err) throw err;
                
                console.log("DBInsertAll:Connected");
                var db = client.db(devicesDBName);
                db.collection(devicesCollectionName).insertMany(devices, function(err, rr) {
                    if (err) throw err;
                    
                    console.log("Number of documents inserted: " + rr.insertedCount);
                    
                    res.render("homepage/dbinsert", {count:rr.insertedCount});
                    client.close();
                });
            });
        });
    })
    .get('/delete', function(req, res){
        var idToFind = req.query.id;
        var MongoObjectID = require("mongodb").ObjectID;
        var objToFind     = { _id: new MongoObjectID(idToFind) };
        
        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            
            console.log("Delete:Connected");
            var db = client.db(devicesDBName);
            var cursor = db.collection(devicesCollectionName).deleteOne(objToFind, null, function(error, result) {
                if (err) throw err;

                res.render("homepage/delete", {idToFind:idToFind});
                client.close();
            });
        });
    })
    .get('/clearDB', function(req, res){
        
        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            
            console.log("ClearDB:Connected");
            var db = client.db(devicesDBName);
            var cursor = db.collection(devicesCollectionName).deleteMany({}, function(error, obj) {
                if (err) throw err;

                res.render("homepage/deleteall", {count:obj.result.n});
                client.close();
            });
        });
    })
    .use(function(req, res, next){
        res.setHeader('Content-Type', 'text/plain');
        res.status(404).send('Page not found !');
    });



    if (typeof callback != 'undefined') {
        callback();
    }
}

module.exports = {
    start: start
};