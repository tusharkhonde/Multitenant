var express			= require('express');
var app				= express.Router();
var bodyParser		= require('body-parser');
var methodOverride	= require('method-override');
var crypto			= require('crypto');
var format			= require('util').format;
var MongoJS			= require("mongojs");
var MongoClient     = require('mongodb').MongoClient;
var url             = require('url');


var db = MongoJS.connect("mongodb://tushardbuser:tushardbpass@ds045021.mongolab.com:45021/tushardb");
//var db = MongoJS.connect("mongodb://localhost:27017/multitenant");

var ObjectId = MongoJS.ObjectId;

// variables ===============================================
var userid = 'userid';
var password = 'password';
var projectName = 'projectName';

var tasks = 'tasks';

// Routes 

// *******Default Route Login Page*********
app.get('/', function(req, res) {
	res.render('login', { title: 'Welcome' });
});

// ******** POST on Login page ************
app.post('/login', function(req, res) {
		
	db.collection('users').findOne({userid : req.body.userid, password: req.body.password}, function(err, users) {
		
		if (!(req.body.userid && req.body.password)) {
			res.render('login',{title:'Welcome',error: 'UserID or Password cannot be blank'});
		} 
		else if( err || !users) {
			res.render('login',{title:'Welcome',error: 'Incorrect UserID or Password'});
		}
		else {
			var string = encodeURIComponent(req.body.userid); 
			db.collection('projects').findOne({userid : req.body.userid} ,function(err, proj) {
				 
			if (users.tenantType == 'kanban'){
			  res.render('kanban',{title:'Welcome',docs: proj.cards, user:req.body.userid, item:users.fields});
			}
			else if (users.tenantType == 'scrum'){
               res.render('scrum',{title:'Welcome', docs:proj.story, user:req.body.userid, item:users.fields});
			}
			else if (users.tenantType == 'waterfall')
			  res.render('waterfall',{title:'Welcome',docs: proj.tasks,user:req.body.userid,item:users.fields});
	 		   
		}); }
	});
	
  });


// Redirect to Signup Page
app.get('/signup', function(req, res) {
	res.render('signup', { title: 'Welcome' });
});

// New User SignUp
exports.signup = app.post('/signup', function(req, res) {
	db.collection('users').find({userid : req.body.userid}, function(err, users) {
		if( err || !users) {
			res.send('Error');
		} else if(users.length != 0) {
			res.json('UserID already in use');
		} else {
			switch(req.body.tenantType) {
				case 'kanban':
					req.body.fields = ["Card Id","Card Name", "Card Description", "Assigned To","Card Type"];
					break;
				case 'waterfall':
					req.body.fields = ["Task ID","Task Name", "Task Description","Start Date", "Finish Date", "Task Type","Assigned To"];
					break;
				case 'scrum':
					req.body.fields = ["Story ID", "Story Title", "Story Description", "Total Hours","Remaining Hours","Assigned To"];
					break;
				default:
					break;
			}
			db.collection('users').insert(req.body);
			db.collection('users').findOne({userid:req.body.userid},function(err,docs){
				res.render('projectcreate',{ title: 'Welcome', userid: req.body.userid, tenant:docs.tenantType});
		});
			
		}
	});
});

//Add projects. 
app.post('/projectcreate', function(req, res) {
	
	if(req.body.tenantType=='kanban'){req.body.cards = [];}
	else if(req.body.tenantType=='scrum'){req.body.story = [];}
	else if(req.body.tenantType=='waterfall'){req.body.tasks = [];}
	
	db.collection('projects').insert(req.body);
	var string = encodeURIComponent(req.body.userid);
	res.redirect('/'+string+'/login');
	
});

//********* Route to tenant after GET on Update/delete/Add/ProjectStatus **********
app.get('/:userid/login', function(req, res) {
	
	db.collection('users').findOne({userid : req.params.userid}, function(err, users) {
		
		  var string = encodeURIComponent(req.params.userid); 
			
		  db.collection('projects').findOne({userid : req.params.userid} ,function(err, proj) {
				 
				if (users.tenantType == 'kanban'){
				  res.render('kanban',{title:'Welcome',docs: proj.cards, user:req.params.userid, item:users.fields});
				}
				else if (users.tenantType == 'scrum'){
	               res.render('scrum',{title:'Welcome', docs:proj.story, user:req.params.userid, item:users.fields});
				}
				else if (users.tenantType == 'waterfall')
				  res.render('waterfall',{title:'Welcome',docs: proj.tasks,user:req.params.userid,item:users.fields});
		 		   
			});
	});

});


//Redirect to Project Status Page
app.get('/:userid/projectstatus', function(req, res) {
 
	db.collection("users").find({userid : req.params.userid}, {"tenantType": 1}, function(err, users) {
		
		if(users[0].tenantType == "waterfall") {
			var a = {};
			db.collection("projects").aggregate( { $match : { "tasks.taskType": "Requested" } }, { $unwind : "$tasks" }, { $match : { "tasks.taskType" : "Requested" } } , function(err, tasks) {
				a["Requested"] = tasks.length;
				db.collection("projects").aggregate( { $match : { "tasks.taskType": "In Progress" } }, { $unwind : "$tasks" }, { $match : { "tasks.taskType" : "In Progress" } } , function(err, tasks) {
					a["In Progress"] = tasks.length;
					db.collection("projects").aggregate( { $match : { "tasks.taskType": "Completed" } }, { $unwind : "$tasks" }, { $match : { "tasks.taskType" : "Completed" } } , function(err, tasks) {
						a["Completed"] = tasks.length;
						var total = a["Requested"] + a["In Progress"] + a["Completed"];
						a["Requested Percentage"] = ((a["Requested"] / total) * 100);
						a["In Progress Percentage"] = ((a["In Progress"] / total) * 100);
						a["Completed Percentage"] = ((a["Completed"] / total) * 100);
						//res.json(a);
						res.render('projectstatus',{title:'Waterfall Project Status',tenant:'waterfall',a:a["Requested Percentage"],b:a["In Progress Percentage"],c:a["Completed Percentage"]});
					});
				});
			});
		} else if(users[0].tenantType == "scrum") {
			console.log("1");
			db.collection("projects").find({userid : req.params.userid, projectName: req.params.project}, function(err, projects) {
				
			});
		} else if(users[0].tenantType == "kanban") {
			var a = [];
			var flag=[];
			db.collection("projects").aggregate( { $match : { "cards.cardType": "To Do" } }, { $unwind : "$cards" }, { $match : { "cards.cardType" : "In Review" } } , function(err, cards) {
				a[0] = cards.length;
				db.collection("projects").aggregate( { $match : { "cards.cardType": "In Review" } }, { $unwind : "$cards" }, { $match : { "cards.cardType" : "In Review" } } , function(err, cards) {
					a[1] = cards.length;
					db.collection("projects").aggregate( { $match : { "cards.cardType": "In Progress" } }, { $unwind : "$cards" }, { $match : { "cards.cardType" : "In Progress" } } , function(err, cards) {
						a[2] = cards.length;
						db.collection("projects").aggregate( { $match : { "cards.cardType": "Completed" } }, { $unwind : "$cards" }, { $match : { "cards.cardType" : "Completed" } } , function(err, cards) {
							a[3] = cards.length;
							console.log(a);
							for(var i=0;i<a.length;i++){
								 console.log(a[i]);
								 if(a[i]<3) {
									 flag[i]='Below Threshold';
								 } else {
									 flag[i]='Above Threshold';
								 }
							 } 
							res.render('projectstatus',{title:'Kanban Project Status',tenant:'kanban',flag:flag });
						});
					});
				});
			});
		} 
		else {
			var string = encodeURIComponent(req.params.userid); 
			res.redirect('/'+string+'/projectstatus');
		}
	});

});


// **********GET request to Add Kanban Card*******
app.get('/:userid/addcard', function(req, res) {
	
	var cards =[{cardId:'',cardName:'',cardDescription:'',assignedTo:''}];
	res.render('kanbantask',{title:'Welcome',userid: req.params.userid,card:cards ,name:'Add Card'});

});

//*********Add Kanban Card *****************
app.post('/addkanban', function(req, res) {
	
	if(req.body.card=='Add Card'){
		db.collection('projects').update( { userid : req.body.userid}, {'$push': {'cards':{'cardId' : req.body.cardId , 'cardName':req.body.cardName,'cardDescription':req.body.cardDescription,'assignedTo':req.body.assignedTo, 'cardType':req.body.cardType}}} );
		var string = encodeURIComponent(req.body.userid);
		res.redirect('/'+string+'/login');
	}
	else if(req.body.card=='Update Card'){
		db.collection('projects').update({userid : req.body.userid, 'cards.cardId': req.body.cardId}, {'$set': {'cards.$' :{'cardId' : req.body.cardId , 'cardName':req.body.cardName,'cardDescription':req.body.cardDescription,'assignedTo':req.body.assignedTo, 'cardType':req.body.cardType}}} );
		var string = encodeURIComponent(req.body.userid);
		res.redirect('/'+string+'/login');
	}
  });

//******** Update/Delete Kanban Card *********
app.post('/updatekanban', function(req, res) {
	if(req.body.update=='update'){
	  db.collection('projects').findOne({'userid':req.body.userid,'cards':{"$elemMatch": {'cardId':req.body.cardId}}},{_id:0,'cards.$': 1},function(err,docs) {
	  res.render('kanbantask',{title:'Welcome',userid: req.body.userid, card:docs.cards,name:'Update Card'});
	 });
	}
	else if(req.body.update=='delete'){
	 db.collection('projects').update({ userid:req.body.userid},{ '$pull': {'cards':{'cardId' : req.body.cardId }} });
	    var string = encodeURIComponent(req.body.userid);
	    res.redirect('/'+string+'/login');
	 }
});


//**********GET request to Add Scrum Story*******
app.get('/:userid/addstory', function(req, res) {
	var stories =[{storyId:'',storyTitle:'',storyDescription:'',totalHours:'',remainingHours:'',assignedTo:''}];
	res.render('scrumtask',{title:'Welcome',userid: req.params.userid, story:stories,name:'Add Story'});
});

//**************Add Scrum Story ***************

app.post('/addscrum', function(req, res) {
	if(req.body.story=='Add Story'){
	  db.collection('projects').update( { userid : req.body.userid}, {'$push': {'story':{'storyId' : req.body.storyId ,'storyTitle' : req.body.storyTitle, 'storyDescription':req.body.storyDescription, 'totalHours':req.body.totalHours,'remainingHours':req.body.remainingHours,'assignedTo':req.body.assignedTo}}} );
	  var string = encodeURIComponent(req.body.userid);
	  res.redirect('/'+string+'/login');
	}
	else if(req.body.story=='Update Story'){
		db.collection('projects').update({userid : req.body.userid, 'story.storyId': req.body.storyId}, {'$set': {'story.$' :{'storyId' : req.body.storyId ,'storyTitle' : req.body.storyTitle, 'storyDescription':req.body.storyDescription,'totalHours':req.body.totalHours,'remainingHours':req.body.remainingHours, 'assignedTo':req.body.assignedTo}}} );
		var string = encodeURIComponent(req.body.userid);
		res.redirect('/'+string+'/login');
	}
	
  });

//******** Update/Delete Scrum Story *********

app.post('/updatescrum', function(req, res) {
	if(req.body.update=='update'){
	 db.collection('projects').findOne({'userid':req.body.userid,'story':{"$elemMatch": {'storyId':req.body.storyId}}},{_id:0,'story.$': 1},function(err,docs) {
		  res.render('scrumtask',{title:'Welcome',userid: req.body.userid, story:docs.story,name:'Update Story'});
	 });
	}
	else if(req.body.update=='delete'){
	 db.collection('projects').update({ userid:req.body.userid},{ '$pull': {'story':{'storyId' : req.body.storyId }} });
	    var string = encodeURIComponent(req.body.userid);
	    res.redirect('/'+string+'/login');
	 }
});

//**********GET request to Add Waterfall atask*******
app.get('/:userid/addtask', function(req, res) {
	var task = [{taskId:'',taskName:'',taskDescription:'',startDate:'',finishDate:'',assignedTo:''}];
    res.render('waterfalltask',{title:'Welcome',userid: req.params.userid, t:task, name:'Add Task'});
});


//**************Add Waterfall Task ***************

app.post('/addwaterfall', function(req, res) {
	if(req.body.task=='Add Task'){
	  db.collection('projects').update({ userid : req.body.userid}, {'$push': {'tasks':{'taskId' : req.body.taskId ,'taskName' : req.body.taskName, 'taskDescription':req.body.taskDescription, 'startDate':req.body.startDate,'finishDate':req.body.finishDate,'assignedTo':req.body.assignedTo}}} );
	  var string = encodeURIComponent(req.body.userid);
	  res.redirect('/'+string+'/login');
	}
	else if(req.body.task=='Update Task'){
		db.collection('projects').update({userid : req.body.userid, 'tasks.taskId': req.body.taskId}, {'$set': {'tasks.$' :{'taskId' : req.body.taskId ,'taskName' : req.body.taskName, 'taskDescription':req.body.taskDescription, 'startDate':req.body.startDate,'finishDate':req.body.finishDate,'assignedTo':req.body.assignedTo}}} );
		var string = encodeURIComponent(req.body.userid);
		res.redirect('/'+string+'/login');
	}
	
  });

//******** Update/Delete Waterfall Task *********

app.post('/updatewaterfall', function(req, res) {
	if(req.body.update=='update'){
	 db.collection('projects').findOne({'userid':req.body.userid,'tasks':{"$elemMatch": {'taskId':req.body.taskId}}},{_id:0,'tasks.$': 1},function(err,docs) {
		  res.render('waterfalltask',{title:'Welcome',userid: req.body.userid, t:docs.tasks,name:'Update Task'});
	 });
	}
	else if(req.body.update=='delete'){
	 db.collection('projects').update({ userid:req.body.userid},{ '$pull': {'tasks':{'taskId' : req.body.taskId }} });
	    var string = encodeURIComponent(req.body.userid);
	    res.redirect('/'+string+'/login');
	 }
});


module.exports = app;
