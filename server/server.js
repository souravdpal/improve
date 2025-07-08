const express = require("express")
const app = express()
const path  = require('path')
const cors = require('cors');
const { features } = require("process");
const port = process.env.PORT || 3000;

app.use(express.json())
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'..','public')));


app.get('/', (req, res) => {
  res.render('root', { var : 'null' });  // Passing data to EJS
});

app.get('/home/hi/:id', (req, res) => {
    let id = req.params.id;
  res.render('home', {id});  // Passing data to EJS
});
app.get('/voice.json', (req, res) => {
   res.type('application/json')
    res.sendFile(path.join(__dirname ,'voice.json')) 
    
});

app.get('/sounds/:id', (req, res) => {
    let id  = req.params.id;
    res.sendFile(path.join(__dirname,'..' ,'public','assets','sounds' , `${id}.mp3`)) 
    
});
app.get('/home/:feature/:name', (req, res) => {
    let features = req.params.feature;
    let name = req.params.name;
  res.render(`${features}`, {name});  // Passing data to EJS
});




















app.listen(port, ()=>{
    console.log(`your app is listening at http://localhost:${port}`)
})