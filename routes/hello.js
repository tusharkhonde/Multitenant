var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var mongojs = require('mongojs');
var db = mongojs('localhost:27017/test', ['kanban']);


router.get('/', function(req, res) {
    
	//MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
	var collection = db.collection('kanban');
	
	var BoardId = 'BoardId';
	var BoardName = 'BoardName';
	var ReqestedTask = 'RequestedTask';
	var TaskInProgress = 'TaskInProgress';
	var Done = 'Done';
	var Archive = 'Archive';
	
	collection.findOne(function(err, val) {
	   
	   console.log("BoardId:" + val.BoardId);
	   console.log("BoardName:" + val.BoardName);
	   console.log("RequestedTask:" + val.RequestedTask);
	   console.log("TaskInProgress:" + val.TaskInProgress);
	   console.log("Done:" + val.Done);
	   console.log("Archive:" + val.Archive);
	   
	   res.render('new',{ title: 'Kanban Details',doc1 : val.BoardId, doc2:val.BoardName,doc3:val.RequestedTask,doc4:val.TaskInProgress,doc5:val.Done, doc6:val.Archive});
	
	});
	
//	collection.find().toArray(function(err, docs) {
//		 docs.forEach(function(doc) {
//         res.render('new',{ title: 'Kanban Details',doc : JSON.stringify(docs) });
//        });
//      });
	
   });	
//});
module.exports = router;
