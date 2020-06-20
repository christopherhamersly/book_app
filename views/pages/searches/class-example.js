// to check in the database for bookshelf

//this needs to go into the client query function
//Need to change the variables to make this render for my page.  Also, need to add this as a nested client Query under the first client (database) query

let secondSQL - 'SELECT DISTINCT from bookshelf FROM books;';

client.query(secondSQL)
.then(results => {

  results.render('pages/seaches/details', {
    book = dbData.rows[0);
      bookshelves:results.rows;
}) 

//need to amend this to make my code work. 


//this is how the form works.  Need to add this to the details.ejs page. 
<datalist id ="browsers">
<% browsers.Foreach(shelf => { %>
  <option value="<%= shelf.bookshelf %>"></option>
<% }) %>

