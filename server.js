'use strict';


const express = require('express');
const superagent = require('superagent');
require('ejs');
require('dotenv').config();
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.get('/add', showBook);
app.get('/books/books:id', getBook);
// app.get('/', getBooks); 
// app.post('/add', addBook);

//Routes
app.get('/', (request, response) => {
  //do a SQL query 
  let sqlQuery = 'SELECT * FROM books'
  return client.query(sqlQuery)
    .then(resultsFromDatabase => {
      if(resultsFromDatabase.rows.rowCount === 0){
        response.render('pages/searches/new.ejs')
      } else {response.render('pages/searches/index.ejs', {bookObject: resultsFromDatabase.rows});
        //sending forward an object called bookObject
      }
    }).catch(error => console.log(error))
})

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

function getBook (request, response){
  // got to the database, get a specific book using an id and show details of that specific book
  // first we are going to have to get the id from the url - request.params
  // go into the database using that id to find that task
  // display that task on its own ejs page
  console.log('this is my request.params - hopefully this is my id:', request.params);
  let id = request.params.id;

  let sql = 'SELECT * FROM books WHERE id = $1';
  let safeValue = [id];

  client.query(sql, safeValue)
    .then (sqlResults => {
      if (id === safeValue) {
        console.log(sqlResults.rows);
        response.status(200).render('details.ejs', {bookObject2: sqlResults.rows[0]});
      } else (response.status(200)
      )
    });
}

// function getBooks (request, response){
//   //get all of the books from my databse and display them on my index.ejs page
//   let sql = 'SELECT * FROM books;'
//   client.query(sql)
//     .then(sqlResults => {
//       let tasks = sqlResults.rows;
//       response.status(200).render('index.ejs', {myBooks: books})
//     })
// }
function showBook(request, response) {
  //display the add form
  response.status(200).render('add.ejs')
}

// function addBook(request, response) {
//   //collect information from the form and add it to the database
//   let {image, title, author, description, isbn} = request.body; 
//   let sql = 'INSERT into BOOKS (image, title, author, description, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
//   let safeValue = [image, title, author, description, isbn];
//   client.query(sql, safeValue)
//     .then(results => {
//       console.log(results.rows);
//       response.redirect('/')
//       response.redirect(`/books/${id}`);
//     })
// }

app.post('/searches', (request, response) => {
  // console.log(request.body.search);
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
      // console.log(results.body.items);
      let bookArray = results.body.items;
      const finalBookArray = bookArray.map(book => {
        // on
        // console.log(book.volumeInfo.industryIdentifiers[0].identifier);
        return new Book(book.volumeInfo)
      });

      // console.log(finalBookArray)

      response.render('pages/searches/show.ejs', {searchResults: finalBookArray})
    })
})

// HELPER FUNCTION
function Book(info) {
  // const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title ? info.title : 'no title available';
  this.author = info.author ? info.author : 'no author available';
  this.description = info.description ? info.description : 'no description available';
  this.isbn = info.industryIdentifiers[0].identifier ? info.industryIdentifiers[0].identifier : 'no isbn available'
}

app.get('*', (request, response) => {
  response.status(200).send('sorry cannot find that route')
})

client.on('error', err => console.log(err));
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })

