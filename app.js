const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json());

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running')
    })
  } catch (e) {
    console.log(`db error:${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//POST register

// app.post('/register', async (request, response) => {
//   const {username, name, password, gender, location} = request.body
//   const hashedPassword = await bcrypt.hash(request.body.password, 10)
//   const query = `SELECT * FROM user WHERE username='${username}'`
//   const dbuser = await db.get(query)
//   response.send(dbuser)
// })

const validUser = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const userdetails = request.body
  const {username, name, password, gender, location} = userdetails
  const hashedPassword = await bcrypt.hash(password, 10)
  const query = `SELECT * FROM user WHERE username='${username}'`
  const dbuser = await app.get(query)
  if (dbuser === undefined) {
    const query = `INSERT INTO user (username,name,password,gender,location) VALUES ('${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}')`
    if (validUser(password)) {
      await db.run(query)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
});

app.post('/login',async(request,response)=>{
  const{username,password}=request.body 
  const query=`SELECT * FROM user WHERE username='${username}'`
  const dbUser=await db.get(query)

  if (dbUser===undefined){
    response.status(400);
    response.send("Invalid user")
  }else{
    const isPasswordMatched=await bcrypt.compare(password,dbUser.password);
    if(isPasswordMatched===true){
      response.send("Login success!")
    }else{
      response.status(400);
      response.send("Invalid password")
    }
  }
})

app.put('/change-password',async (request,response)=>{
  const {username,oldPassword,newPassword}=request.body 
  const query=`SELECT * FROM user WHERE usename='${username}'`
  const databaseUser=await db.get(query)
  if (databaseUser===undefined){
    response.status(400);
    response.send("Invalid user")
  }else{
    const isPasswordMatched=await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched===true){
      if (validUser(newPassword)){
        const hashedPassword=await bcrypt.hash(newPassword,10);
        const updatePasswordQuery=`
        UPDATE 
        user 
        SET 
        password='${hashedPassword}'
        WHERE 
        username='${username}';
        `;
        const user=await db.run(updatePasswordQuery)
        response.send("Password updated")
      } else {
        response.status(400);
        response.send("Password is too short")
      }
    } else {
      response.status(400);
      response.send("Invalid current password")
    }
  }
});

module.exports = app
