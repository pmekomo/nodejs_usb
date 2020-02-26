var http = require('http');
var usb  = require('usb');
var usbDetect = require('usb-detection')
var express = require('express');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost';
var devicesDBName = "myDevicesDB"
var devicesCollectionName ='USBDevices'

var app = express();

app.get('/', function(req, res){
    res.setHeader('Content-Type','text/html');
    res.send('<!DOCTYPE html>'+
             '<html>'+
	     '    <head>'+
	     '        <meta charset="utf-8" />'+
	     '        <title>Naval-Group !</title>'+
	     '    </head>'+ 
	     '    <body>'+
	     '     	<h1><strong>WELCOME TO THE MAIN PAGE</strong></h1>'+
	     '           <a href=alldevices> Display all available devices </a><br>'+
		 '	         <a href=displaydatabase> Display the database content </a>'+
	     '    </body>'+
	     '</html>');
})
.get('/alldevices', function(req, res){
    var text = '<h1><strong> ALL AVAILABLE DEVICES </strong> </h1>';
    res.setHeader('Content-Type', 'text/html');
    
    usbDetect.startMonitoring();
	usbDetect.find(function(err, devices) {
		
		devices.forEach(function(device){
			text += '<ul> <strong>' + device.deviceName + '</strong>';
			for (let [key, val] of Object.entries(device)){
				if (key != 'deviceName'){
					text += "<li>" + key +':'+ val + "</li>";
				}
			}
			text += '</ul>';
			text += "<a href=insert?vId="+ device.vendorId +"&pId="+device.productId+"> save the equipment in the database </a> <br>"
		});
		console.log(devices, err);
		text += "<a href=insertedintodatabase> Insert all these devices into the database </a>"
		text+="<br>";
		text += "<a href=/> Back to the main page </a>"
		res.send(text);
	});
    
})
.get('/insert', function(req, res){
    var pid = req.query.pId;
    var vid = req.query.vId;
    var text;
    res.setHeader('Content-Type', 'text/html');
    usbDetect.find(parseInt(vid,10), parseInt(pid, 10), function(err, devices) { console.log('find '+vid+' '+pid, devices, err);
		MongoClient.connect(url, function(err, client) {
			if (err) throw err;
			
			console.log("Connected");
			var db = client.db(devicesDBName);
			db.collection(devicesCollectionName).insertMany(devices, function(err, rr) {
				if (err) throw err;
				if (rr.insertedCount > 1){
					text ="<p> "+ rr.insertedCount+" devices have been inserted into the database <p>";
				}
				else{
					text ="<p> 1 device has been inserted into the database <p>";
				}
				console.log("Number of documents inserted: " + rr.insertedCount);
				text +="<br>";
				text += "<a href=displaydatabase> Display the database content </a>";
				text+="<br>";
				text += "<a href=/> Back to the main page </a>"
				res.send(text);
				client.close();
			});
		});
	});
})
.get('/insertedintodatabase', function(req, res){
	var text;
    res.setHeader('Content-Type', 'text/html');
	
	usbDetect.startMonitoring();
	usbDetect.find(function(err, devices) {
		MongoClient.connect(url, function(err, client) {
			if (err) throw err;
			
			console.log("Connected");
			var db = client.db(devicesDBName);
			db.collection(devicesCollectionName).insertMany(devices, function(err, rr) {
				if (err) throw err;
				if (rr.insertedCount > 1){
					text ="<p> "+ rr.insertedCount+" devices have been inserted into the database <p>";
				}
				else{
					text ="<p> 1 device has been inserted into the database <p>";
				}
				console.log("Number of documents inserted: " + rr.insertedCount);
				text +="<br>";
				text += "<a href=displaydatabase> Display the database content </a>";
				text+="<br>";
				text += "<a href=/> Back to the main page </a>"
				res.send(text);
				client.close();
			});
		});
	});
})
.get('/displaydatabase', function(req, res){
	var text = '<h1><strong> ALL AVAILABLE DEVICES IN THE DATABASE </strong> </h1>';
    res.setHeader('Content-Type', 'text/html');

	MongoClient.connect(url, function(err, client) {
		if (err) throw err;
		
		console.log("Connected");
		var db = client.db(devicesDBName);
		var cursor = db.collection(devicesCollectionName).find();
        cursor.forEach(function(doc) {
			if (doc != null) {
                text += '<a href=device?id=' + doc._id + '><strong> EQ-ID: ' + doc._id + '</strong></a><br>';
			    text += "[ deviceName: " + doc.deviceName + "] <br>";
			    text += "[ manufacturer: " + doc.manufacturer + "] <br>";
            }
	    }, function(err){
			    text+="<br>";
				text += "<a href=/> Back to the main page </a>"
		        res.send(text);
			    client.close();
		   }
	    );
	});
	//res.send('<p> Display devices of the database<p>');
})
.get('/device', function(req, res){
    var idToFind = req.query.id;
    var MongoObjectID = require("mongodb").ObjectID;
    var objToFind     = { _id: new MongoObjectID(idToFind) };
    
    var text = "<p> <strong> Details of Equipment "+ idToFind + ":</strong><p>";
    MongoClient.connect(url, function(err, client) {
		if (err) throw err;
		
		console.log("Connected");
		var db = client.db(devicesDBName);
		var cursor = db.collection(devicesCollectionName).findOne(objToFind, function(err, doc){
			if (err) throw err;
			
			for (let [key, val] of Object.entries(doc)){
			    if (key != "_id")
				    text += "[" + key +': '+ val + "] <br>";
			}
			text+="<a href=action> Action to perform </a> <br>"
			text+= "<a href=displaydatabase> Display the database content </a><br>";
			text+="<a href=delete?id="+ idToFind +"> Delete the equipment </a> <br>"
			console.log(doc);
			res.send(text);
		});
	});
})
.get('/delete', function(req, res){
    var idToFind = req.query.id;
    var MongoObjectID = require("mongodb").ObjectID;
    var objToFind     = { _id: new MongoObjectID(idToFind) };
    
    var text = "<p> <strong> Equipment "+ idToFind + " deleted</strong><p>";
    MongoClient.connect(url, function(err, client) {
		if (err) throw err;
		
		console.log("Connected");
		var db = client.db(devicesDBName);
		var cursor = db.collection(devicesCollectionName).remove(objToFind, null, function(error, result) {
			if (err) throw err;
			
			text+="<a href=displaydatabase> Display the database </a> <br>"
			text+="<a href=/> Back to the main page </a> <br>"
			res.send(text);
		});
	});
})
.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page not found !');
});

app.listen(8080);

/*usbDetect.startMonitoring();

usbDetect.on('add', function(device) {
	console.log(device);
});

usbDetect.startMonitoring();*/

/*usb.on('attach', function(device){
	device.open();
    device.getStringDescriptor(device.deviceDescriptor.iManufacturer, function (err, manufacturer) {
    device.getStringDescriptor(device.deviceDescriptor.iProduct, function (err, product) {
      console.log(manufacturer, product);
      device.close();
  });
});
    console.log('*** New device connected ***');
});

usb.on('detach', function(device){
    console.log('!!! Device disconnected !!!');
    console.log(device.allConfigDescriptors);
});*/
