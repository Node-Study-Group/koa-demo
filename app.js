var fs = require('fs');

var koa = require('koa');
var parse = require('co-body');
var Mustache = require('mustache');

var app = koa();

// logger, Ripped from koajs.com

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log(this.method + " " + this.url + ", " + ms + " milliseconds");
})

// for the cookies

app.keys = ['totally', 'secret', 'keys'];

app.use(function *(next){
  
  var n = parseInt(this.cookies.get('views')) + 1;

  this.cookies.set('views', (n) ? n : 1);
  return yield next;
});

// Responds to a POST request. Writes to directory with given filename and msg.

app.use(function *(next){

  if ('POST' !== this.method) return yield next;
  var body = yield parse(this);
  fs.writeFile(__dirname + '/' + body.filename, body.msg, 'utf8', function(err){
    if (err) console.log(err);
  });

  yield next;
});

// this serves index.html at the base url. Uses fs.readdir to get a list of all available files.

app.use(function *(next){
  if ("/" !== this.path) return yield next;
  var template = yield readFile('index.html');
  var allFiles = yield readdir();
  this.type = 'html';
  this.status = 200;
  this.body = Mustache.render(template, {'files': allFiles, 'views': parseInt(this.cookies.get('views')) + 1 || 1});
});

// serves contents of a given file (matching the url path).
// if the url path is instead a directory, it lets the user know.
// if the url path has no match in the directory, it yields downstream

app.use(function *(next){

  try {
    var fileStat = yield stat(this.path);    
  } catch (e) {
    return yield next;
  }
  
  if (fileStat.isFile()) {
    this.type = 'html';
    this.status = 200;
    this.body = yield readFile(__dirname + this.path);
  } else {
    this.type = 'html';
    this.status = 200;
    this.body = "<h1>That there is a directory</h1>"
  }
});

// 404 response

app.use(function *(){
  this.type = 'html';
  this.status = 404;
  this.body = "<h1>I have nothing like that</h1>"
});

app.listen(3000);

// helper Promisifications

function readFile(fileName){
  return new Promise(function(resolve, reject){
    fs.readFile(fileName, 'utf8', function(err, data){
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function readdir(){
  return new Promise(function(resolve, reject){
    fs.readdir('.', function(err, files){
      if (err) return reject(err);
      resolve(files);
    });
  });
}

function stat(file){
  return new Promise(function(resolve, reject){
    fs.stat(__dirname + file, function(err, data){
      if (err) return reject(err);
      resolve(data);
    });
  });
}