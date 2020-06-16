'use strict';


const express = require('express');
const superagent = require('superagent');
require('ejs');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true }));  
app.use(express.static('public'));
app.set('view engine', 'ejs');

//Routes
app.get('/', (request, response) => {
  response.render('pages/searches/index.ejs');
});

app.get('/booksearch', (request, response) => {
  response.render('pages/searches/new.ejs')
})

app.get('/hello', (request, response) => {
  response.status(200).send('hello from the backend')
});

app.get('/searches', (request, response) => {
  response.render('pages/searches/show.ejs');
});

// app.get('/new', (request, response) => {
//   response.render('./')
// })

app.post('/searches', (request, response) => {
  // console.log(request.body.search);
  // { search: [ 'the great gatsby', 'title' ] }
  // { search: [ 'jeff noon', 'author' ] }

  let query = request.body.search[0];
  let titleOrAuthor = request.body.search[1];

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(titleOrAuthor === 'title'){
    url+=`+intitle:${query}`;
  }else if(titleOrAuthor === 'author'){
    url+=`+inauthor:${query}`;
  }

  superagent.get(url)
    .then(results => {
      console.log(results.body.items);
      let bookArray = results.body.items;
      const finalBookArray = bookArray.map(book => {
        console.log(book.volumeInfo.authors);
        console.log(book.volumeInfo.imageLinks);
        return new Book(book.volumeInfo)
      });

      console.log(finalBookArray)

      response.render('pages/searches/show.ejs', {searchResults: finalBookArray})
    })
})


// HELPER FUNCTION
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title ? info.title : 'no title available';
  this.author = info.author ? info.author : 'no author available';
  this.description = info.description ? info.description : 'no description available';

}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
