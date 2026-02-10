// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.send("Hello World!");
});

function hello() { return "Hello" };
hello();

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for testing the db
// Create a route for testing the db with an ID
app.get("/db_test/:id", function(req, res) {

    let id = parseInt(req.params.id, 10);

    let sql = 'SELECT * FROM test_table WHERE id = ' + id;

    db.query(sql).then(results => {

        if (results.length === 0) {
            res.send("<h2>No student found</h2>");
            return;
        }

        let name = results[0].name;

        res.send(`
            <h2>Student Record</h2>
            <p><strong>Name:</strong> ${name}</p>
        `);
    });
});


// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a route for /roehampton
app.get("/roehampton", function(req, res) {
    res.send("Hello roehampton!");
    console.log(req.url)
});

// Create a route for roehampton with some logic processing the request string
app.get("/roehampton2", function(req, res) {
    console.log(req.url)
    let path = req.url;
    res.send(path.substring(0,3))
})

// Additional task
// Create a route for /roehampton
app.get("/roehampton3", function(req, res) {
    // 1️⃣ Capture the request URL
    let path = req.url; // "/roehampton"
    // 2️⃣ Convert string to array of characters
    let chars = path.split(''); // ["/","r","o","e","h","a","m","p","t","o","n"]
    // 3️⃣ Remove the leading '/'
    chars.splice(0, 1); // ["r","o","e","h","a","m","p","t","o","n"]
    // 4️⃣ Reverse the array
    chars.reverse(); // ["n","o","t","p","m","a","h","e","o","r"]
    // 5️⃣ Join back into a string
    let reversed = chars.join(''); // "notpmaheor"
    // 6️⃣ Send it to the browser
    res.send(reversed);
    // Optional: print original URL to terminal for debugging
    console.log(path);
});

// Additional task 2
// Create a dynamic route for /number/:n
app.get("/number/:n", function(req, res) {
    // 1️⃣ Get the number from the URL and convert to integer
    let n = parseInt(req.params.n, 10);
    // 2️⃣ Start the HTML table as a string
    let table = "<table border='1'><tr><th>Numbers</th></tr>";
    // 3️⃣ Loop from 0 to n
    for (let i = 0; i <= n; i++) {
        table += "<tr><td>" + i + "</td></tr>";
    }
    // 4️⃣ Close the table
    table += "</table>";
    // 5️⃣ Send the table as the response
    res.send(table);
});


// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Create a dynamic route which where a user may request /user/:id 
// where the ID can be any ID number.
//  Output the input ID to the browser.
app.get("/user/:id", function(req, res) {
    console.log(req.params);
    res.send("user " + req.params.id);
});

// Create a dynamic route which where a user may request /student/:name/:id 
// where the ID can be any ID number, and the name can be any name. 
// Output the name and ID to the browse
/*app.get("/student/:name/:id", function(req, res) {
    console.log(req.params);
    res.send("student " + req.params.name + " with ID " + req.params.id);
});*/

app.get("/student/:name/:id", function(req, res) {
    let name = req.params.name;
    let id = req.params.id;

    res.send(`
        <h2>Student Details</h2>
        <table border="1">
            <tr>
                <th>Name</th>
                <th>ID</th>
            </tr>
            <tr>
                <td>${name}</td>
                <td>${id}</td>
            </tr>
        </table>
    `);
});


// Json output all students
app.get("/students", async (req, res) => {
  try {
    const students = await db.query(
      `SELECT s.id, s.name, sp.programme
       FROM Students s
       LEFT JOIN Student_Programme sp ON s.id = sp.id`
    );
    res.json(students);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Error fetching students");
  }
});

// HTML table of all students with links
app.get("/students/table", async (req, res) => {
  try {
    const students = await db.query(
      `SELECT s.id, s.name, sp.programme, p.name AS programme_name
       FROM Students s
       LEFT JOIN Student_Programme sp ON s.id = sp.id
       LEFT JOIN Programmes p ON sp.programme = p.id`
    );

    let html = `
      <h1>All Students</h1>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Name</th>
          <th>Programme</th>
        </tr>
    `;

    students.forEach(student => {
      html += `
        <tr>
          <td><a href="/students/${student.id}">${student.name}</a></td>
          <td>${student.programme_name || "N/A"}</td>
        </tr>
      `;
    });

    html += `</table>`;
    res.send(html);

  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Error fetching students");
  }
});

// Create a single-student page which lists a student name,
//  their programme and their modules
app.get("/students/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get student + programme
    const studentData = await db.query(
      `SELECT s.name, p.name AS programme_name
       FROM Students s
       LEFT JOIN Student_Programme sp ON s.id = sp.id
       LEFT JOIN Programmes p ON sp.programme = p.id
       WHERE s.id = ?`,
      [id]
    );

    if (studentData.length === 0) {
      return res.status(404).send("Student not found");
    }

    const student = studentData[0];

    // Get modules for the student's programme
    const modules = await db.query(
      `SELECT m.name AS module_name
       FROM Programme_Modules pm
       JOIN Modules m ON pm.module = m.code
       WHERE pm.programme = (
         SELECT programme FROM Student_Programme WHERE id = ?
       )`,
      [id]
    );

    let html = `
      <h1>${student.name}</h1>
      <p><strong>Programme:</strong> ${student.programme_name || "N/A"}</p>
      <h2>Modules</h2>
      <ul>
    `;

    modules.forEach(m => {
      html += `<li>${m.module_name}</li>`;
    });

    html += `</ul>`;
    res.send(html);

  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Error fetching student details");
  }
});


// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});