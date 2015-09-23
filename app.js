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

app.use(function *(next){
  if ('POST' !== this.method) return yield next;
  var body = yield parse(this);
  fs.writeFile(__dirname + '/' + body.filename, body.msg, 'utf8', function(err){
    if (err) console.log(err);
  });
  yield next;
});

app.use(function *(next){
  if ("/" !== this.path) return yield next;
  var template = yield readFile('index.html');
  var allFiles = yield readdir();
  this.type = 'html';
  this.status = 200;
  this.body = Mustache.render(template, {'files': allFiles});
});

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