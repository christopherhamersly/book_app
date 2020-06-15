

'use strict';

const express = require('express');
const app = express();
  
app.use(express.urlencoded({extended: true}));
  
require('dotenv').config();
  
const PORT = process.env.PORT || 3001;
  
  
app.use(express.static('./public'));
  

app.get('/hello', (request, response) => {
  response.status(200).send('hello from the back end');
});

app.post('/contact', (request, response) => {
  console.log(request.body);
  // { firstName: 'bob',
  // lastName: 'smith',
  // message: 'hiya',
  // phone: '123-455-8989',
  // contact: 'phone' }
  
  response.sendFile('thanks.html', {root: 'public'})
})
  
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})