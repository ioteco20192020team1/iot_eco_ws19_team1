var token = <insert you token id>
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = ScriptApp.getService().getUrl(); //ScriptApp.getService().getUrl();
var sheet = SpreadsheetApp.openById(<insert you spreadsheet id>);

//Process Data from Sensor
var cache = CacheService.getScriptCache();
var last_ambient_temperature = 15;

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
  Logger.log(ScriptApp.getService().getUrl());
}

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  if(typeof e !== 'undefined')
    return HtmlService.createTemplateFromFile("index").evaluate();
}

function doPost(e) {  
  if(typeof e.parameter.data !== 'undefined') {
    photon(e);
  } else {
    bot(e);
  }
}

function photon(e) { 
  data = JSON.parse(e.parameter.data)
  if(data.id == 'warning') {
    //utils.sleep(7000);
    send_thermal_image("1033850112")
  } else if (data.pixels) {
    var arr = [];    
    for (var i = 0; i < data.pixels.length; i++){
      arr.push(Number(data.pixels[i]))
    }
    
    var pixel_arr = generateTwoDimArray(arr, 8);
    pixel_arr = interpolate_image(pixel_arr, 32, 32);
    pixel_arr = generateOneDimArray(pixel_arr);
    pixel_arr = roundOneDimArray(pixel_arr);
    cache.put('pixels', pixel_arr)
  }
  return ContentService.createTextOutput(JSON.parse(e.parameter));
}

function bot(e) {
  // this is where telegram works
  var data = JSON.parse(e.postData.contents);
  var text = data.message.text;
  var id = data.message.chat.id;
  //cache.put("id",id);
  var name = data.message.chat.first_name + " " + data.message.chat.last_name;
  var answer = "";
  
  if (text == "remote") {
    answer = cache.get('remote_temperature') + " °C";
  }
  else if (text == "ambient") {
    answer = cache.get('ambient_temperature') + " °C";
  }
  else if (text == "image") {
      
      send_thermal_image(id)
  }
  else if (text == "temp") {
    var pixels = cache.get('pixels');
    var pixels = JSON.parse("[" + pixels + "]");
    var arr = [];
    
    for ( var i = 0; i < pixels.length; i++){
      arr.push(Number(pixels[i]));
    }
               
    answer = getMaxTemp();

  } else if (text == "id") {
    answer = String(id); 
  }
  else {
    answer = "Follow Command are avaible: \n image \t return the current thermal image!";
  }
      sendText(id,answer);   
}

function sendTest() {
  var id = String(1033850112)
  var photoId = DriveApp.getFileById("15hDY6DmT3bce3aNtMBCwOFbQLbrzdjo6").getId()
  url = "http://drive.google.com/uc?export=view&id=" + photoId
  Logger.log(sendPhoto(id,url))
}

function sendPhoto(id,photo) {
    var files = {
       'method': 'sendPhoto',
       'chat_id': String(id),
       'photo' : photo,
       'caption' : 'Max Temp: ' + getMaxTemp()
        }

    var data = {
       'method' : 'post',
       'payload': files
}  
  var url = telegramUrl + '/'
  return UrlFetchApp.fetch(url,data);
  
}

function sendText(id,text) {
    var payload = {
       'method': 'sendMessage',
       'chat_id': String(id),
       'text': String(text),
       'parse_mode': 'HTML',
       'disable_web_page_preview': 'false'
        }

    var data = {
       "method": "post",
       "payload": payload
}  
  var url = telegramUrl + '/'
  var response = UrlFetchApp.fetch(url,data);
  Logger.log(response.getContentText());
}


function send_thermal_image(id) {
      var base64 = String(cache.get("thermal_image")).split(',')[1]
      Logger.log(base64)
      var decoded = Utilities.base64Decode(base64);
      var blob = Utilities.newBlob(decoded, MimeType.PNG, "thermal_image");
      var folder=DriveApp.getFolderById('1bkr3A2_0xvRa2veOKfGjChUxhW-FbFqd');
      photo = folder.createFile(blob);
      photourl = "http://drive.google.com/uc?export=view&id=" + photo.getId()
      sendPhoto(id,photourl)
}

function getMaxTemp() {
    var pixels = cache.get('pixels');
    var pixels = JSON.parse("[" + pixels + "]");
    var arr = [];
    
    for ( var i = 0; i < pixels.length; i++){
      arr.push(Number(pixels[i]));
    }
  return Math.max.apply(null, arr) + " °C";
}

function save_thermal_image_in_Folder(){
  var folder=DriveApp.getFolderById('1bkr3A2_0xvRa2veOKfGjChUxhW-FbFqd');
  var base64 = String(cache.get("thermal_image")).split(',')[1]
  var decoded = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(decoded, MimeType.PNG, "thermal_image");
  folder.createFile(blob);
  file = DriveApp.createFile(blob);
}


function include(filename){
 return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getViewContent(name){
 return HtmlService.createHtmlOutputFromFile(name).getContent()
}

function get_last_ambient_temperature(){
  return cache.get('ambient_temperature');
}

function get_last_remote_temperature(){
  return cache.get('remote_temperature');
}

function get_last_motion_state(){
  return cache.get('motion_state');
}

function get_last_pixels(){
  return cache.get('pixels');
}


function receive_thermal_image(imagedata) {
  cache.put('thermal_image',imagedata)
}

function saveDataURIInFile(filename,datauri,type) {
  Logger.log('filename: %s\ndatauri: %s\ntype: %s\n',filename,datauri,type);
  if(true) {
    var folder=DriveApp.getFolderById('1bkr3A2_0xvRa2veOKfGjChUxhW-FbFqd');
    var files=folder.getFilesByName(filename);
    while(files.hasNext()) {
      files.next().setTrashed(true);
    }
    var f=folder.createFile(filename,datauri,MimeType.PNG);
    return {name:f.getName(),id:f.getId(),type:type,uri:DriveApp.getFileById(f.getId()).getBlob().getDataAsString()};
  }else{
    throw('Invalid input in saveDataURIInFile.');
  }
}

function generateTwoDimArray(arr, size_x){
 
  var twoDim = [];
  for (var index = 0; index < arr.length; index += size_x)
    twoDim.push( arr.slice(index, index + size_x) );
  
  return twoDim;
}

function generateOneDimArray(data){
  var arr = Array.prototype.concat.apply([],data)
  return arr;
}

function roundOneDimArray(data){
  
  var r = [];
  
  for (var x in data) {
    r.push(Math.round(data[x] * 10) / 10);
  }
  
  return r;
}

function interpolate_image(image, new_width, new_height){
  
  var scaled_image = new Array(new_height);
  
  for (var i = 0; i < new_height; i++){
    scaled_image[i] = new Array(new_width);
  }
  
  var src_width = image[0].length;
  var src_height = image.length;
  
  var mu_x = (src_width - 1.0) / (new_width - 1.0);
  var mu_y = (src_height - 1.0) / (new_height - 1.0);
  
  for (var y_idx = 0; y_idx < new_height; y_idx++) {
    for (var x_idx = 0; x_idx < new_width; x_idx++) {
      
      var x = x_idx * mu_x;
      var y = y_idx * mu_y;
      
      var adj_2d = get_adjacents_2d(image, x, y);
      
      var frac_x = x - Math.floor(x);
      var frac_y = y - Math.floor(y);
      
      var out = bicubicInterpolate(adj_2d, frac_x, frac_y);
      scaled_image[y_idx][x_idx] = out;
    }
  }
  return scaled_image;
}

//a and b are the two points to the left, c and d are the two points to the right
function cubicInterpolate(x, a, b, c, d){
  
  var result = b + (0.5 * x * (c - a + x*(2.0*a - 5.0*b + 4.0*c - d + x*(3.0*(b - c) + d - a)))); 
  
  return result;
}

// p is a 16-point 4x4 array of the 2 rows & columns left/right/above/below
function bicubicInterpolate(p, x, y){
  
  var i0 = cubicInterpolate(x, p[0][0], p[0][1], p[0][2], p[0][3]);
  var i1 = cubicInterpolate(x, p[1][0], p[1][1], p[1][2], p[1][3]);
  var i2 = cubicInterpolate(x, p[2][0], p[2][1], p[2][2], p[2][3]);
  var i3 = cubicInterpolate(x, p[3][0], p[3][1], p[3][2], p[3][3]);
  
  return cubicInterpolate(y, i0, i1, i2, i3);
}


//Return a 4x4 Array with the 16 neighboring pixels of a point
function get_adjacents_2d(arr, x, y){

  var dest = new Array(4);
  
  for (var i = 0; i < 4; i++){
    dest[i] = new Array(4);
  }
  //sheet.appendRow([String(arr)]);
  for (var delta_y = -1; delta_y < 3; delta_y++) {
    dest[delta_y + 1][0] = get_point(arr, x-1, y + delta_y);
    dest[delta_y + 1][1] = get_point(arr, x, y + delta_y);
    dest[delta_y + 1][2] = get_point(arr, x+1, y + delta_y);
    dest[delta_y + 1][3] = get_point(arr, x+2, y + delta_y);
  }
  //sheet.appendRow(["Adjacents of Point",x,",",y,":", String(dest)]);
  return dest;
} 

function get_point(arr, x, y) {
  
  var sizeX = arr[0].length;
  var sizeY = arr.length;
  
  var tmp_x = Math.floor(x);
  var tmp_y = Math.floor(y);
  
  if (x < 0) 
    tmp_x = 0;
  if (y < 0) 
    tmp_y = 0;
  if (x >= sizeX) 
    tmp_x = sizeX - 1;
  if (y >= sizeY) 
    tmp_y = sizeY - 1;
  Logger.log("tmp_y: " + tmp_y);
  return arr[tmp_y][tmp_x];
}
  
