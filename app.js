var fs = require('fs');

var koa = require('koa');

var app = koa();

app.use(function *(){
  this.type = 'html'
  this.body = fs.createReadStream('index.html');
});

app.listen(3000);