'use strict';

const express = require('express');
const superagent = require('superagent');
require('ejs');
require('dotenv').config();
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');

// middleware
// this allows us to see the request.body - parses it
app.use(express.urlencoded({ extended: true }));
// serves files from the public folder
app.use(express.static('public'));
// allows ejs to work - look in the views folder for your template
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));



//Routes

app.get('/', getBooks); // rendering our home page which shows all our saved books from our database
app.get('/add', showSearchForm); // shows our search form
app.get('/books/:id', getOneBook); // shows our detail page
app.post('/searches', getBooksFromAPI); // takes in our search form information and displays our show.ejs page - results from our API
app.post('/details', addToFavorites); // takes form data from the API and adds a book to our database and then redirects to a detail page

app.put('/update/:bookId', updateBook );
app.delete('/delete/:bookId', deleteBook);

app.get('*', (request, response) => {
  response.status(200).send('sorry cannot find that route')
})


//lets us translate our post to a put

function updateBook(request, response){
  //collect the information that needs to be updated
  // console.log('this our params', request.params);
  let bookId = request.params.bookId;
  // console.log('form information to be updated');

  let {image, title, author, description, isbn} = request.body;
  console.log('request.body', request.body);
  let sql = 'UPDATE books SET image=$1, title=$2, author=$3, description=$4, isbn=$5 WHERE id=$6;';

  let safeValues = [image, title, author, description, isbn, bookId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      // console.log('sqlResuts',sqlResults);
      response.redirect(`/books/${bookId}`);
    }).catch(error => console.log(error))
}

function deleteBook(request, response){
  let bookId = request.params.bookId;
  let sql = 'DELETE FROM books WHERE id=$1;';
  let safeValues = [bookId];
  client.query(sql, safeValues)
    .then(sqlResults => {
      console.log('sql results from Delete',sqlResults);
      response.redirect('/');
    })
}

function getBooks(request, response){
  let sqlQuery = 'SELECT * FROM books;';
  return client.query(sqlQuery)
    .then(resultsFromDatabase => {
      if(resultsFromDatabase.rowCount === 0){
        response.status(200).render('pages/searches/new.ejs');
      } else {
        response.render('pages/searches/index.ejs', {bookObject: resultsFromDatabase.rows});
      }
    }).catch(error => console.log(error));

}

function addToFavorites(request, response){

  let {title, authors, description, image, isbn} = request.body;

  let sql = 'INSERT INTO books (title, author, description, isbn, image) VALUES ($1, $2, $3, $4, $5) RETURNING id;';

  let safeValue = [title, authors, description, isbn, image];

  client.query(sql, safeValue)
    .then(results => {
      let id = results.rows[0].id;
      response.status(200).redirect(`/books/${id}`);
    })
}

// function getOneBook (request, response){
//   let id = request.params.id; 

//   let sql = 'SELECT * FROM books WHERE id = $1;';
//   let safeValue = [id];

//   client.query(sql, safeValue)
//     .then (sqlResults => {

//       //collect the information from the form
//       console.log('information from my form', request.body);

//       let {title, authors, description, image_url, isbn} = request.body;

//       // put the database

//       let sql = 'INSERT INTO books (title, author, description, isbn, image) VALUES ($1, $2, $3, $4, $5) RETURNING id;';

//       let safeValue = [title, authors, description, isbn, image_url];

//       client.query(sql, safeValue)
//         .then(results => {
//           console.log('results from postgres', results.rows);
//           // [ { id: 3 } ]
//           let id = results.rows[0].id;
//           // redirect to the detail page
//           response.status(200).redirect(`/books/${id}`);
//         })
//     });
// }

function getOneBook (request, response){
  // got to the database, get a specific book using an id and show details of that specific book
  // first we are going to have to get the id from the url - request.params
  // go into the database using that id to find that task
  // display that task on its own ejs page
  // console.log('this is my request.params - hopefully this is my id:', request.params);
  let id = request.params.id; // 2

  let sql = 'SELECT * FROM books WHERE id = $1;';
  let safeValue = [id]; // [2]

  client.query(sql, safeValue)
    .then (sqlResults => {

      console.log('my sql results', sqlResults.rows);
      // [ { id: 1,
      //   image: 'http://books.google.com/books/content?id=EJUwetZIMZcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
      //   title: 'To Kill a Mockingbird Study Guide and Student Workbook (Enhanced Ebook)',
      //   author: 'no author available',
      //   description: 'no description available',
      //   isbn: '9781609339005' } ]


      response.status(200).render('pages/searches/details.ejs', {bookObject2: sqlResults.rows[0]});

    });
}

function showSearchForm(request, response) {
  //display the add form
  response.status(200).render('pages/searches/new.ejs')
}

function getBooksFromAPI(request, response){
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
      let bookArray = results.body.items;
      const finalBookArray = bookArray.map(book => { 
        return new Book(book.volumeInfo)
      })

      response.render('pages/searches/show.ejs', {searchResults: finalBookArray})
    })
    .catch(err => {
      console.error('ERROR', err);
    })
}


// HELPER FUNCTION
function Book(info) {
  // const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title ? info.title: 'no title available';
  this.author = info.author? info.author: 'no author available';
  this.description = info.description ? info.description: 'no description available';
  this.isbn = info.industryIdentifiers[0].identifier ? info.industryIdentifiers[0].identifier : 'no isbn available';
}


client.on('error', err => console.log(err));
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })
