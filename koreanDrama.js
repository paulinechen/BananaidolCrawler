var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var Crawler = require("crawler").Crawler;
var csv = require("fast-csv");
var app = express();
var count = 0 ;
var url = 'http://23.23.31.233:3000/api/v2/dramas/dramas_with_views.json';
var info;


var urlArray = Array();
var titleArray = Array();
var linkArray = Array();
var j = 0;
var k = 0; // the index for the titleArray;
var linkCount = 0;

var drama_href = Array();
var drama_name = Array();


var csvStream = csv.createWriteStream({headers: true}).transform(function(row){
        return {
           keyid: row.keyid,
           name: row.name,
           episode: row.episode,
           type: row.type,
           linkid: row.linkid
        };
    }),
writableStream = fs.createWriteStream("mycsv.csv");

writableStream.on("finish",function(){
	console.log("DONE!");
});		
csvStream.pipe(writableStream);		 

process.on('uncaughtException', function (err) {
    console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

request(url, function(error,response,json){
info = JSON.parse(json); 
})


app.get('/scrape', function(req, res){
	httpResponse(res,"Processing...");
    // for the top layer

	var c = new Crawler({
		"maxConnections":1,
	});

	// for the middle layer
	var crawler = new Crawler({
     	"maxConnections":1,
     	"callback": function(error, result, $){
			var i = 0;
			var counter = 0;  
			var title = $("title").text(); 
		//if(title.indexOf("貴夫人")==-1){
			$("h4").children().children().children().filter(function(){	


				if(counter<3){ 				
				var data2 = $(this);	
				urlArray[i] = data2.attr("href"); 
				titleArray[i] = data2.text(); 

				if(titleArray[i].indexOf("土豆")==-1){
					crawler2.queue(urlArray[i]);	
				}
				i++;
				counter++;
			}

			}) 
		//}
		/*
		else{

			$("h4").children().children().children().filter(function(){	
				var data2 = $(this);	
				urlArray[i] = data2.attr("href"); 
				titleArray[i] = data2.text(); 

				if(titleArray[i].indexOf("土豆")==-1){
					crawler2.queue(urlArray[i]);	
				}
				i++;
			}) 

		}
		*/

		}
	});


	// for the bottom layer
	var crawler2  = new Crawler({
		"maxConnections":100,
		"timeout":1000000,
		"callback": function(error, result, $){
			if (error) {
			console.log(err);
			} else { 
			var title = $("title").text(); 
			var links = new String();
			var type = new String();

			$(".playlist_stand > a").filter(function() {
    		var data = $(this);    		
    		var href = data.attr("href"); 
    		type = "dailymotion";

            	if(href.indexOf("dailymotion")!=-1){       
    			links = links + href.replace("http://www.dailymotion.com/video/","") + ",";
    	   		}	
			}) 
			 
			try {
	    		var rePattern = new RegExp(/第(.*)集/); 
				var arrMatches = title.match(rePattern);
	    		var reTitlePattern = new RegExp(/(.*)第/);
				var arrTitleMatches = title.match(reTitlePattern);
				for(var a = 0; a<info.length; a++){
					if(arrTitleMatches[0].replace(" 第","").indexOf(info[a].n)!=-1){
						var keyid = info[a].i;
					}
				}
	           
	           if(typeof keyid ==='number'&& typeof links==='string'){

	           	if(arrTitleMatches[0].replace(" 第","").indexOf("Trot戀人")==-1){

	           	console.log(keyid + "|" + arrTitleMatches[0].replace(" 第","") + "|" + parseInt(arrMatches[0].replace("第","").replace("集","")) + "|"+ type + "|" + links.substring(0,links.length-1));
	           	
	           	var url_api = 'http://54.221.241.105:5000/UPDATE/DRAMASINFO?id='+keyid+'&link='+links.substring(0,links.length-1)+'&type=dailymotion&num='+parseInt(arrMatches[0].replace("第","").replace("集",""));
	           
				csvStream.write({keyid: keyid, name: arrTitleMatches[0].replace(" 第",""),episode: parseInt(arrMatches[0].replace("第","").replace("集","")),type: type,linkid: links.substring(0,links.length-1)});
				linkCount = linkCount + 1;

					request(url_api, function(){
	           		console.log("api requested! the keyid is "+keyid);
	           		})

				}
				}

				if (linkCount==20) {
	            	csvStream.write(null);
				}

        	} catch(err) {
        		console.log(err);
        	}
        	}
		}
	})


	c.queue([
	{
		// the top layer
		"url":"http://www.bananaidol.com/kd",
		"timeout":1000000,
		"callback": function(error, result, $){

			$(".widget_tag_cloud > a").filter(function(){
				if(count<42){ // number of dramas
				var data3 = $(this);
 				drama_href[j] = data3.attr("href");
 				drama_name[j] = data3.attr("title");
 				count++;
 				j++;
 				}
			})
			// scraping the middle layer
			for(var a = 0;a<drama_href.length;a++){
				crawler.queue(drama_href[a]);				
			}		
		}
	}  
	]);

}) // end of app.get

 
app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;


function httpResponse(response, data) {
        try {
                response.setHeader('Content-Length', Buffer.byteLength(data));
                response.setHeader('Content-Type', 'application/json; charset="utf-8"');
                response.write(data);
                response.end();
        } catch(err) {
                console.log(err);
        }

}
