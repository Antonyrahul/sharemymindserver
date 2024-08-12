const crypto = require('crypto')
const express = require('express');
const app = express();
const cors = require('cors')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile, getFileStream } = require('./s3')
const bodyparser = require('body-parser');
const mongodbclient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const stripe = require('stripe')('sk_test_7rzV99nirKvA19YjsPGeONga');
const fs = require('fs')
const { Client } = require("@notionhq/client")
const axios = require('axios');
const cheerio = require('cheerio');
const urlMetadata = require('url-metadata');
const ogs = require('open-graph-scraper');
const linkify = require("linkifyjs");



// import { NotionAPI } from 'notion-client'
//const NotionAPI = require("notion-client")
var mysql      = require('mysql');

var connection = mysql.createConnection({
    host     : '15.207.102.121',
    user     : 'root',
    password : 'Saidapet15',
    database : 'creatorsministry_prod'
  });

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nextaculartest',
  password: 'Laptop@123',
  port: 5432,
})

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());


app.use(cors({
      allowedHeaders: ["authorization", "Content-Type"], // you can change the headers
      exposedHeaders: ["authorization"], // you can change the headers
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false
    })
  );
dburl = "mongodb://127.0.0.1:27017/"
usersDB = "sahremymindusersDB"
userscollecton = "sharemyminduserscollection"
folderDB = "sharemymindfolderDB"
folderCollection = "sharemymindfoldercollection"
//const Editor=require('./builder.js')


app.post('/loginuser', function (req, res) {
    console.log(req.body);
    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(usersDB);
        var findarr ={ email: req.body.email }

           
        
        var collname = userscollecton

        db.collection(collname).findOne(findarr, function (err, data) {
            if (data) {
                if (err) throw err;
                bcrypt.compare(req.body.password, data.password, function (err, result) {
                    if (err) throw err;

                    if (result == true) {
                        console.log("logged in")
                        var jwtToken = jwt.sign({ id: data.id }, 'qazwsxedcrfv')
                        client.close();
                        res.status(200).json({
                            message: "LOGGED IN",
                            jwttoken: jwtToken,
                            name: data.name,
                            email: data.email,
                            username:data.username,
                            accstatus: data.accstatus,
                            uniqueid: data.uniqueid,
                            status: 200
                        });


                    }
                    else {
                        client.close();
                        res.status(401).json({
                            message: "Incorrect password"
                        })

                        console.log("wrong creds")
                    }
                });



            }
            else {
                client.close();
                res.status(401).json({
                    message: "Incorrect username"
                })
            }
        })
        // Store hash in your password DB.



    });

})

app.post('/registeruser', function (req, res) {
    console.log(req.body);
    var uniqueid;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');
        console.log("Uniqueid",uniqueid)


    })
    var findarr ={ email: req.body.email }

      
    

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(usersDB);
        var collname = userscollecton
        db.collection(collname).findOne(findarr, function (err, data) {
            console.log(data)
            if(!data)
            {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            if (err) throw err;
            var accstatus = "verified"
            

            var userData = {
                email: req.body.email,

                password: hash,
                uniqueid: uniqueid,
                accstatus: req.body.accstatus,


            }
            db.collection(collname).insertOne(userData, function (err, data) {
                console.log("success")
                if (err) throw err;
                client.close();
                res.json({
                    message: "saved",
                    data: data,
                    userdata: userData
                })
            })
            // Store hash in your password DB.
        });
    }
    else{
        client.close();
        res.status(400).json({
            message:"username taken"
        })
    }
    })
        // client.close();
    });


})

app.post('/addfolder', function (req, res) {
    console.log(req.body);
    var uniqueid;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');


    })

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(folderDB);



        var collname = folderCollection

        var userData = {
            foldername: req.body.folderName,
        }
        db.collection(collname).findOne(userData, function (err, data) {

            if (data) {
                client.close()
                res.status(403)
                res.json({
                    message: "already exists"

                })
            }
            else {
                userData.folderID=uniqueid
                db.collection(collname).insertOne(userData, function (err, data) {
                    if (err) throw err;
                    client.close();
                    res.json({
                        message: "saved",
                        data: data,
                        userdata: userData
                    })
                })
            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/addurlforuser', async function (req, res) {
    console.log(req.body);
    var uniqueid;
    var description;
    var title;
    var imgUrl;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');


    })
    try{
    const findUrl= linkify.find(req.body.url)
    console.log(findUrl)
    if(findUrl && findUrl[0].type=="url")
    {
            const options = { url: findUrl[0].value };
            const parsedvalues= await ogs(options)
            console.log(parsedvalues)
            console.log(parsedvalues.result.ogImage)
            imgUrl=parsedvalues.result.ogImage[0].url
            console.log(parsedvalues.result.ogDescription)
            description =parsedvalues.result.ogDescription
            console.log(parsedvalues.result.ogTitle)
            title= parsedvalues.result.ogTitle
    // ogs(options)
    //   .then((data) => {
    //     const { error, html, result, response } = data;
    //     console.log('error:', error);  // This returns true or false. True if there was an error. The error itself is inside the result object.
    //     console.log('html:', html); // This contains the HTML of page
    //     console.log('result:', result); // This contains all of the Open Graph results
    //     console.log('response:', response); // This contains response from the Fetch API
    //   })
    }
}
catch(err)
{
    console.log(err)
}

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(usersDB);
       


        var collname = userscollecton
 
  
        var finddata = {email:req.body.email}
        db.collection(collname).findOne(finddata, function (err, data) {

            if (data) {
               
                console.log(data)
                
                var filter = {email:req.body.email}
                
                var result={url:req.body.url,uniqueid:uniqueid}
                if(title)
                {
                    var result={url:req.body.url,uniqueid:uniqueid,title,description,imgUrl}
                }
                db.collection(collname).updateOne(filter, { $push: { notes: result } }, function (err, data) {
                    console.log(data)
                    client.close()
                    res.json({
    
                        message: "saved",
                        data: data
                    })
                })
             
                // res.json({
                //     message: "already exists"

                // })
            }
            else {
                // userData.folderID=uniqueid
                // db.collection(collname).insertOne(userData, function (err, data) {
                //     if (err) throw err;
                //     client.close();
                //     res.json({
                //         message: "saved",
                //         data: data,
                //         userdata: userData
                //     })
                // })
               
                console.log("nope")
            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/addfileforuser', function (req, res) {
    console.log(req.body);
    var uniqueid;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');


    })

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(usersDB);
       


        var collname = userscollecton

  
        var finddata = {"$and":[{username:req.body.username},{folders: {$elemMatch: {uniqueid:req.body.uniqueid}}}]}
        db.collection(collname).findOne(finddata, function (err, data) {

            if (data) {
               
                console.log("addfileforuserdata",data)
                
                var filter = finddata
                var result={filename:req.body.filename,uniqueid:uniqueid}
                db.collection(collname).updateOne(filter, { $push: { "folders.$.filename":result } }, function (err, data) {
                    console.log("gotcha",data)
                    client.close()
                    res.json({
    
                        message: "saved",
                        data: data
                    })
                })
             
                // res.json({
                //     message: "already exists"

                // })
            }
            else {
                // userData.folderID=uniqueid
                // db.collection(collname).insertOne(userData, function (err, data) {
                //     if (err) throw err;
                //     client.close();
                //     res.json({
                //         message: "saved",
                //         data: data,
                //         userdata: userData
                //     })
                // })
               
                console.log("nope")
            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})


app.get('/getfolders', function (req, res) {
    console.log(req.body);

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(folderDB);


        var collname = folderCollection

        var userData = {
            foldername: req.body.folderName,
        }
        db.collection(collname).find({}).toArray(function (err, data) {
            if (err)
                throw err;
            if (data) {
                client.close()

                res.json({
                    message: "saved",
                    data: data,

                })
            }
            else {


                client.close();
                res.status(400)
                res.json({
                    message: "nada"

                })

            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/getnotesforuser', async function (req, res) {
    console.log(req.body);
    // const options = { url: 'https://www.npmjs.com/package/open-graph-scraper' };
    // ogs(options)
    //   .then((data) => {
    //     const { error, html, result, response } = data;
    //     console.log('error:', error);  // This returns true or false. True if there was an error. The error itself is inside the result object.
    //     console.log('html:', html); // This contains the HTML of page
    //     console.log('result:', result); // This contains all of the Open Graph results
    //     console.log('response:', response); // This contains response from the Fetch API
    //   })

    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(usersDB);


        var collname = userscollecton

        var finddata = {
            email: req.body.email,
        }
        db.collection(collname).find(finddata).toArray(function (err, data) {
            if (err)
                throw err;
            if (data) {
                client.close()

                res.json({
                    message: "saved",
                    data: data,

                })
            }
            else {


                client.close();
                res.status(400)
                res.json({
                    message: "nada"

                })

            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})


app.post('/getfoldercontent', function (req, res) {
    console.log(req.body);


    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(folderDB);


        var collname = folderCollection


        db.collection(collname).findOne(req.body, function (err, data) {
            if (err)
                throw err;
            if (data) {
                client.close()

                res.json({
                    message: "saved",
                    data: data,

                })
            }
            else {


                client.close();
                res.status(400)
                res.json({
                    message: "nada"

                })

            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/getimagecontent', function (req, res) {
    console.log(req.body);


    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(folderDB);


        var collname = folderCollection


        db.collection(collname).findOne({foldername:req.body.foldername},{imagedata: {$elemMatch: {photoID:req.body.imageid}}}, function (err, data) {
            if (err)
                throw err;
            if (data) {
                client.close()

                console.log(data)
                var wantedData = data.imagedata.filter(elem=>{return elem.photoID==req.body.imageid})
                data.imagedata=wantedData
                console.log(wantedData)
                console.log(data)

                res.json({
                    message: "saved",
                    data: data,

                })
            }
            else {


                client.close();
                res.status(400)
                res.json({
                    message: "nada"

                })

            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/addphoto', upload.single('file'), async function (req, res) {
    console.log("bodyyyyyy",req.body);
    console.log("fileeeeeee",req.file)
    //console.log(req.body.body)
    const file = req.file
    var uniqueid;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');


    })
    try {
        const result = await uploadFile(file)
        console.log("result",result)
        result.freesub=req.body.freesub
        result.title=req.body.title
        result.description=req.body.description
        result.price=req.body.price
        result.photoID= uniqueid
        console.log(result)
        res.json({url:result.Location})
        // mongodbclient.connect(dburl, function (err, client) {
        //     if (err) throw err;
        //     var db = client.db(folderDB);


        //     var filter = {
        //         foldername: req.body.foldername

        //     }
        //     console.log(filter)
        //     var collname = folderCollection

        //     db.collection(collname).updateOne(filter, { $push: { imagedata: result } }, function (err, data) {
        //         res.json({

        //             message: "saved",
        //             data: result
        //         })
        //     })
        // })
    }
    catch (e) {
        console.log(e)
        res.status(500)
        res.json({

            message: "error",

        })
    }








    // mongodbclient.connect(dburl, function (err, client) {
    //     if (err) throw err;
    //     var db = client.db(folderDB);


    //     var collname = folderCollection


    //     db.collection(collname).findOne(req.body, function (err, data) {
    //         if (err) 
    //         throw err;
    //         if(data){
    //             client.close()

    //             res.json({
    //                 message: "saved",
    //                 data: data,

    //             })
    //         }
    //         else{
    //         db.collection(collname).insertOne(userData, function (err, data) {
    //             if (err) throw err;
    //             client.close();
    //             res.status(400)
    //             res.json({
    //                 message:"nada"

    //             })
    //         })
    //     }
    //     })
    //     // Store hash in your password DB.


    //     // client.close();
    // });

})

app.post('/editphotodetails', function (req, res) {
    
    console.log(req.body);


    mongodbclient.connect(dburl, function (err, client) {
        if (err) throw err;
        var db = client.db(folderDB);


        var collname = folderCollection
     


        db.collection(collname).updateOne({"imagedata.photoID":req.body.imageid}, { "$set": { "imagedata.$.price" : req.body.price,"imagedata.$.title" : req.body.title,"imagedata.$.description" : req.body.description,"imagedata.$.freesub" : req.body.freeSub } }, function (err, data) {
            if (err)
                throw err;
            if (data) {
                client.close()

                res.json({
                    message: "saved",
                    data: data,

                })
            }
            else {


                client.close();
                res.status(400)
                res.json({
                    message: "nada"

                })

            }
        })
        // Store hash in your password DB.


        // client.close();
    });

})

app.post('/payment',async function(req,res){
    console.log("ulla")

//     const account = await stripe.accounts.create({type: 'standard',
//     // "capabilities[card_payments][requested]":"true",
//     // "capabilities[transfers][requested]":"true"
// });

//    console.log(account)
    // const accountLink = await stripe.accountLinks.create({
    //     account: 'acct_1KCJNPSHl2J5pI6g',
    //     refresh_url: 'http://localhost:3000/pay',
    //     return_url: 'http://localhost:3000/pay',
    //     type: 'account_onboarding',
    //   });
    //   console.log(accountLink)
    // const account = await stripe.accounts.create({
    //     country: 'IN',
    //     type: 'custom',
    //     capabilities: {
    //       card_payments: {requested: true},
    //       transfers: {requested: true},
    //     },
    //   });
    //   console.log(account)
    const accountLink = await stripe.accountLinks.create({
        account: 'acct_1KCKZISFJgSmoR1J',
        refresh_url: 'http://localhost:3000/pay',
        return_url: 'http://localhost:3000/pay',
        type: 'account_onboarding',
        collect: 'eventually_due',
      });
      console.log(accountLink)
})


app.post('/save',async function(req,res){
    console.log("bodyyyyyy",req.body);
    console.log("fileeeeeee",req.file)
    //console.log(req.body.body)
    const file = {"originalname":"index.html",path:"./index.html"}
    var uniqueid;
    crypto.randomBytes(4, (err, buf) => {
        if (err) throw err;
        uniqueid = buf.toString('hex');


    })
    try {

        fs.writeFile("./index.html", req.body.content, async function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
                    const result = await uploadFile(file)
        console.log("result",result)
  
        console.log(result)
        res.json({success:`Written to file ${result.Location} `})
            //res.json({success:'done bro'})
        }); 

        // mongodbclient.connect(dburl, function (err, client) {
        //     if (err) throw err;
        //     var db = client.db(folderDB);


        //     var filter = {
        //         foldername: req.body.foldername

        //     }
        //     console.log(filter)
        //     var collname = folderCollection

        //     db.collection(collname).updateOne(filter, { $push: { imagedata: result } }, function (err, data) {
        //         res.json({

        //             message: "saved",
        //             data: result
        //         })
        //     })
        // })
    }
    catch (e) {
        console.log(e)
        res.status(500)
        res.json({

            message: "error",

        })
    }
})

app.get('/checkpostgres', function (req, res) {
    console.log(req.body);
    pool.query('SELECT * FROM workspaces ORDER BY id ASC', (error, results) => {
        console.log(results)
        if (error) {
          throw error
        }
        res.status(200).json(results.rows)
      })


})


app.get('/builder', async function (req, res) {
    console.log(req.body);
    const notion = new Client({
        auth:"secret_x4Y6AglH6SwD5pXDSuEwZaz3iAEEJpoGlVATDPmOpMZ",
      })
  
      
        const pageId = "testing-db-faec2bf0aec44b698e42fec19ab7277c";
        const response = await notion.pages.retrieve({ page_id: pageId });
        console.log(response);
      


})



app.post('/checkpostgres1', function (req, res) {
    console.log(req.body);
    

    pool.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS workspaceHTMLL text;", (error, results) => {
        console.log(results)
        if (error) {
          throw error
        }
        else{
            const values = [req.body.wpacecode,req.body.htmlcode]

            pool.query(`UPDATE workspaces SET "workspacehtml" = $2 WHERE "workspaceCode" = $1`,values,(error, results) => {
               // console.log(results)
                if (error) {
                  throw error
                }
                res.status(200).send(results)
              })
        
        }
        // res.status(200).send(results)
      })


    // pool.query("UPDATE workspaces SET workspaceHTML = '<div>hola</div>' WHERE id = 'cl8jr6tyb0494f8un932nnfgm';", (error, results) => {
    //     console.log(results)
    //     if (error) {
    //       throw error
    //     }
    //     res.status(200).send(results)
    //   })


})

// app.post('/notion', async function (req, res) {
//     console.log(req.body);
    
//     const api = new NotionAPI()

//     // fetch a page's content, including all async blocks, collection queries, and signed urls
//     const page = await api.getPage('067dd719-a912-471e-a9a3-ac10710e7fdf')
//     console.log(page)




// })
app.get('/mysqldata',function(req,res){
    connection.connect();
 
connection.query('SELECT * FROM `posts`', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});
 
connection.end();
})


app.listen(8000, function () {

    console.log("listening on port 8000");
});