var express = require('express'); // Used for the route
var app = express();
var bodyParser = require('body-parser'); // Parsing middleware
var morgan = require('morgan'); // Logger middleware
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./app/models/user'); // get our mongoose model
var Movimento = require('./app/models/movement'); // get our mongoose model
var Pin = require('./app/models/pin'); // get our mongoose model
var Advise = require('./app/models/advise'); // get our mongoose model
var UserToVerify = require('./app/models/userToVerify'); // get our mongoose model
var database = require('./database'); // get database gestion file
var moment = require('moment'); // used for date's calculating

// Requires multiparty 
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();

// Requires data store
var DataStoreController = require('./dataStore');

// =======================
// ==== configuration ====
// =======================
var port = process.env.PORT || 3001; // used to create, sign, and verify tokens
var ip = "https://bancaunicambackend.herokuapp.com";

app.set('superSecret', config.secret); // secret variable (prelevata da config.js)

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// enable CORS 
var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  //  i can go on only if cores are not required
  if ('OPTIONS' === req.method) {
    res.send(200);
  } else {
    next();
  }
};

// enable CORS
app.use(allowCrossDomain);

// inizialize DB
database.init();

// ==============
// === routes ===
// ==============

// route for test
app.get('/', function (req, res) {
  var date = new Date();
  var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  // creating a new user
  var user1 = new User({
    email: 'nicolo.ruggeri@studenti.unicam.it',
    password: 'password',
    meta: {
      //Name
      firstName: 'Nicolò',
      //Surname
      lastName: 'Ruggeri',
      //Date of birth
      dateOfBirth: '24-10-1995',
      //phone number
      numberOfPhone: '0345753978',
      //Residence
      residence: 'Loc. Casa N.1',
      //Fiscal Code
      fiscalCode: 'FWEF43G453G43'
    },
    numberOfAccount: 100002,
    availableBalance: 5000,
    active: true,
    dateOfCreation: today
  });

  //creating a new user
  var user2 = new User({
    email: 'lorenzo.stacchio@studenti.unicam.it',
    password: 'password',
    meta: {
      //Name
      firstName: 'Lorenzo',
      //Surname
      lastName: 'Stacchio',
      //Date of birth
      dateOfBirth: '21-09-1992',
      //phone number
      numberOfPhone: '0345753978',
      //Residence
      residence: 'casa mia',
      //Fiscal code
      fiscalCode: '3g43q4g465g'
    },
    numberOfAccount: 100001,
    availableBalance: 5000,
    active: true,
    dateOfCreation: today
  });

  var admin = new User({
    email: 'luca.marasca@studenti.unicam.it',
    password: 'password',
    admin: true,
    meta: {
      //Name
      firstName: 'Luca',
      //Surname
      lastName: 'Marasca',
      //Date of birth
      dateOfBirth: '23-04-1990',
      //phone number
      numberOfPhone: '0345753978',
      //Residence
      residence: 'casa mia',
      //Fiscal code
      fiscalCode: '3g43q4g465g'
    },
    numberOfAccount: 100000,
    availableBalance: 7000,
    active: true,
    dateOfCreation: today
  });

  var mov = new Movimento({
    from: 100002,
    to: 100001,
    date: today,
    quantity: 500
  });

  database.findUserByEmail(user2.email, function (result) {
    //  if it's already registred i can't 
    if (result) {
      res.json({
        success: false,
        message: 'Utenti predefiniti già presenti nel DB'
      });
      return;
    }
    database.addUser(user1, function (result, messaggio) {
      console.log(messaggio);
      database.addUser(user2, function (result, messaggio) {
        console.log(messaggio);
        database.addUser(admin, function (result, messaggio) {
          console.log(messaggio);
          database.sortUsersByNumberOfAccount(function (result) {
            console.log(result);
          });
          database.addTransaction(mov, function (result, messaggio) {
            console.log(messaggio);
            database.allMovementsSend(100, function (result) {
              console.log(result);
            });
            mov = new Movimento({
              from: 100001,
              to: 100002,
              date: today,
              quantity: 1500
            });
            database.addTransaction(mov, function (result, messaggio) {
              console.log(messaggio);
              database.allMovementsSend(200, function (result) {
                console.log(result);
              });
              mov = new Movimento({
                from: 100002,
                to: 100001,
                date: today,
                quantity: 500
              });
              database.addTransaction(mov, function (result, messaggio) {
                console.log(messaggio);
                database.allMovementsSend(100, function (result) {
                  console.log(result);
                });
                res.json({
                  success: result,
                  message: messaggio
                });
              });
            });
          });
        });
      });
    });
  });
});

//email validation
app.get('/verify', function (req, res) {
  if (!req.query.code)
    res.json({
      result: false,
      message: 'Codice non inserito.'
    });
  else
    database.findUsersByLink(req.query.code, function (ris, result) {
      if (ris) {
        database.findUserByAccount(result, function (ris, result) {
          if (ris) {
            database.activateAccount(result, function (ris, message) {
              if (ris)
                res.json('Il tuo account è stato attivato correttamente.');
              else
                res.json({
                  result: false,
                  message: 'Riscontrati problemi con il database.'
                });
            });
          }
          else
            res.json({
              result: false,
              message: 'Riscontrati problemi con il database.'
            });
        });
      }
      else
        res.json({
          result: false,
          message: 'Codice errato o precedentemente attivato.'
        });
    });
});

//  return the users list (for test)
app.get('/list', function (req, res) {
  database.sortUsersByNumberOfAccount(function (result) {
    result.forEach(function (user) {
      console.log(user.email);
    }, this);
    res.json(result);
  });
});

//  return last five alert
app.get('/get-avvisi', function (req, res) {
  database.returnLastFiveAdvises(function (result) {
    res.json(result);
  });
});

//  Sign up a new user
app.post('/singup', function (req, res) {

  if (!req.body.pin || !req.body.email || !req.body.password) {
    res.json({
      success: false,
      message: 'Dati mancanti.'
    });
    return;
  }
  // Looking for the PIN
  database.verifyPin(req.body.pin, function (result) {
    if (!result)  // If PIN doesn't exist --> throw error
    {
      res.json({
        success: false,
        message: 'Pin errato.'
      });
      return;
    }

    //  If PIN exists, i take the user data 
    var metadata = result.meta;
    var saldoDefault = result.availableBalance;

    //  Verify if email is already used
    database.findUserByEmail(req.body.email, function (result) {

      if (result) {
        res.json({
          success: false,
          message: 'Email già in uso.'
        });
        return;
      }

      //  Calculated the account number of the new user
      database.findMaxNumberOfAccount(function (result) {
        var nAccount = 100000; // 100000 is the default account number (if DB is empty)

        if (result.length > 0)
          if (result[0].numberOfAccount != undefined)
            nAccount = (result[0].numberOfAccount + 1);

        var date = new Date();
        var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

        //  Creating new user
        var user = new User({
          email: req.body.email,
          password: req.body.password,
          meta: metadata,
          numberOfAccount: nAccount,
          dateOfCreation: today,
          availableBalance: saldoDefault,
          image: req.body.image,
          active: false,
          admin: false
        });

        //  I can it to the DB
        database.addUser(user, function (result, messaggio) {
          if (result) {
            //  Delete PIN from the list
            database.deleteRecordPin(req.body.pin);

            //  Dinamic Link creation
            var date = new Date();
            var milliseconds = date.getMilliseconds();
            var indirizzo = ip + "/verify/?code=" + (milliseconds + req.body.pin);

            var utente = new UserToVerify({
              numberOfAccount: nAccount,
              link: (milliseconds + req.body.pin)
            });

            database.addUserToVerify(utente, function (result) {
              //  if it's already used 
              if (!result) {
                res.json({
                  success: false,
                  message: "Non è stato possibile aggiungere l' utente da verificare."
                });
              }
              else {
                //  send convalidation email
                var servizioPosta = require('nodemailer');

                var postino = servizioPosta.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'banca.unicam@gmail.com',
                    pass: 'programmazioneweb'
                  }
                });

                postino.sendMail({
                  from: 'BANCA UNICAM',
                  to: req.body.email,
                  subject: "Conferma registrazione Banca Unicam",
                  text: "Seguire il link per procedere con la registrazione:\n" + indirizzo
                }, function (err, info) {
                  if (err) {
                    console.log(err);
                    res.json({
                      success: false,
                      message: err
                    });
                    return;
                  }
                  if (info)
                    console.log(info);
                });

                res.json({
                  success: true,
                  message: "Ti è stata inviata un email per confermare la registrazione."
                });
              }
            });
          }
          else
            res.json({
              success: result,
              message: messaggio
            });
        });
      });
    });
  });
});

// Upload images
app.post('/uploadPic', multipartyMiddleware, DataStoreController.uploadFile, function (req, res) {
  if (req.success)
    res.json({
      success: true,
      image: req.name,
      message: 'Foto caricata correttamente.'
    });
  else
    res.json({
      success: false,
      message: 'Errore sconosciuto.'
    });
});

// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router();

// route to authenticate a user
apiRoutes.post('/authenticate', function (req, res) {
  database.autenticate(req.body.email, req.body.password, function (result, messaggio) {
    if (result == false)
      res.json({
        success: false,
        message: messaggio
      });
    else {
      // return the information including token as JSON
      database.findUserByEmail(req.body.email, function (risultato) {
        if (!risultato) {
          res.json({
            success: false,
            message: 'Authentication failed. User not found.'
          });
          return;
        }
        // create a token (come dato di creazione del token viene utilizzata l'email associata)
        var token = jwt.sign(risultato.numberOfAccount, app.get('superSecret'), {
          //expiresInMinutes: 1440 // expires in 24 hours (ATTENZIONE non funziona su windows)
        });

        res.json({
          success: true,
          message: 'Successfull!',
          token: token,
          admin: risultato.admin
        });

      });
    }
  });
});

// route middleware to verify a token
apiRoutes.use(function (req, res, next) {

  // check header or url parameters or post parameters or cookie 
  var token = req.headers['x-access-token'] || req.body.token || req.query.token; // || req.cookies.authToken;

  // decode token
  if (token) {

    // verifies secret and checks exp (controllo che non sia tarocco)
    jwt.verify(token, app.get('superSecret'), function (err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save the number of account to request for use in other routes
        req.decoded = parseInt(decoded);
        next();
      }
    });

  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
});

//  Return the user data 
apiRoutes.post('/userData', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    var risposta = {
      success: ris,
      result: result
    };
    res.json(risposta);
  });
});

//  Return the logged user
apiRoutes.post('/userDataNAccount', function (req, res) {
  database.findUserByAccount(req.body.n_account, function (ris, result) {
    res.json({
      success: ris,
      result: result
    });
  });
});

//  modify user's personal data
apiRoutes.post('/updateUserData', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris) {
      database.modifyCredential(result, req.body.email, req.body.password, req.body.phone, req.body.residence, function (ris, message) {
        res.json({
          success: ris,
          message: message
        });
      });
    }
    else
      res.json({
        message: 'Errore, ci sono problemi con il database.',
        success: false
      });
  });
});

//  Return the list of all the movements
apiRoutes.post('/movements', function (req, res) {
  // req.decoded  Contains logged user's email
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris) {
      var nAccount = result.numberOfAccount;
      //  im asking for exit movements
      database.allMovementsReceive(nAccount, function (result) {
        var movIn;

        if (result) {
          movIn = result;
          database.allMovementsSend(nAccount, function (result) {
            var movOut;

            if (result) {
              movOut = result;

              var allMov = [];
              var i = 0;

              //  I take all the entrance movements
              while (i < movIn.length) {
                allMov[i] = {
                  data: movIn[i].date,
                  entrata: movIn[i].quantity,
                  uscita: 0,
                  conto: movIn[i].from
                };
                i++;
              }
              var j = 0;

              //  I take all the expense movements
              while (j < movOut.length) {
                allMov[i] = {
                  data: movOut[j].date,
                  entrata: 0,
                  uscita: movOut[j].quantity,
                  conto: movOut[j].to
                };
                i++;
                j++;
              }

              // return movements list
              res.json({
                success: true,
                result: allMov
              });
            }
            else {
              res.json({
                message: 'Errore, ci sono problemi con il tuo numero di conto.',
                success: false
              });
            }
          });
        }
        else {
          res.json({
            message: 'Errore, ci sono problemi con il tuo numero di conto.',
            success: false
          });
        }
      });
    }
    else {
      res.json({
        message: 'Errore interno, la tua email non è più presente nel database.',
        success: false
      });
    }
  });
});

//Bank transfer and transation by admin
apiRoutes.post('/invio-bonifico-admin', function (req, res) {
  var date = new Date();
  var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

  //  Ceck if the user is admin
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris) {
      if (result.admin) {
        var bonifico = new Movimento({
          from: req.body.from,
          to: req.body.to,
          date: today,
          quantity: req.body.quantity
        });

        //Control function ----
        if (bonifico.from == bonifico.to) {
          res.json({
            message: "ERRORE, non è possibile inviare bonifico tra due account con lo stesso numero di conto",
            success: false
          });
          return;
        }
        //Ceck if number of account exist
        database.findUserByAccount(bonifico.from, function (success1, result_admin1) {
          database.findUserByAccount(bonifico.to, function (success2, result_admin2) {
            if (success1 == false) {
              res.json({
                message: "Numero di conto ordinante inesistente!!",
                success: false
              });
              return
            }
            if (success2 == false) {
              res.json({
                message: "Numero di conto beneficiario inesistente!!",
                success: false
              });
              return
            }
            //Ceck if users is admin
            if (result_admin1.admin || result_admin2.admin) {
              res.json({
                message: "Non è possibile effettuare transazioni verso o da un admin, in quando l'admin non contiene un conto bancario",
                success: false
              });
              return;
            }
            else {
              //  add transiction and response 
              database.addTransaction(bonifico, function (result, messaggio) {
                res.json({
                  message: messaggio,
                  success: result
                });
              });
            }
          });
        });
      }
      else {  //  if user's not admin ---> throw error
        res.json({
          message: 'Impossible accedere a questa sezione senza essere admin.',
          success: false
        });
      }
    }
    else {  //  if user is not in DB
      res.json({
        message: 'Errore interno al database, utente non trovato.',
        success: false
      });
    }
  });
});

//Test Transation and bank transfer by user
apiRoutes.post('/invio-bonifico-user', function (req, res) {
  var date = new Date();
  var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

  //  im looking for user's email (logged user)
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris) {
      var bonifico = new Movimento({
        from: result.numberOfAccount,
        to: req.body.to,
        date: today,
        quantity: req.body.quantity
      });

      //Ceck that user can't do a transaction to himself
      if (bonifico.from == bonifico.to) {
        res.json({
          message: "ERRORE, non è possibile inviare bonifico tra due account con lo stesso numero di conto",
          success: false
        });
        return;
      }
      database.findUserByAccount(bonifico.to, function (success, result_admin1) {
        if (success == false) {
          res.json({
            message: "Numero di conto inesistente!!",
            success: false
          });
          return
        }
        //Ceck if recived user is admin
        if (result_admin1.admin) {
          res.json({
            message: "Non è possibile effettuare transazioni verso un admin, in quando l'admin non contiene un conto bancario",
            success: false
          });
          return;
        }
        else {
          //  adding the transation to the DB
          database.addTransaction(bonifico, function (result, messaggio) {
            res.json({
              message: messaggio,
              success: result
            });
          });
        }
      });
    }
    else {  // If i don't find account number
      res.json({
        message: 'Errore interno al database, il suo numero conto non è stato trovato.',
        success: false
      });
    }
  });
});

//  this function return the media of the cash sent in transaction
apiRoutes.post('/CalcolaMediaUscite', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, user) {
    if (ris)
      database.sumCashOutside(user.numberOfAccount, function (result, data) {

        if (!result) {
          res.json({
            success: false,
            message: 'Riscontrati problemi nel database.'
          });
        }
        else
          if (!data)
            res.json({
              success: true,
              message: 'Dati inviati correttamente.',
              data: 0
            });
          else {
            var date = new Date();
            var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

            var then = moment(user.dateOfCreation, "YYYY-MM-DD");
            var now = moment(today, "YYYY-MM-DD");
            //  get the difference in days
            var days = moment.duration(now.diff(then)).asDays();

            //  if the difference is negative
            if (days < 0) {
              res.json({
                success: false,
                message: 'Riscontrati problemi con le date nel database.'
              });
            }
            else {

              if (days == 0)
                days = 1;

              //  Calculating spend average
              var ris = data.sumQuantity / days;

              res.json({
                success: result,
                message: 'Dati inviati correttamente.',
                data: ris
              });
            }
          }
      });
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi nel database.'
      });
  });
});

//  this function return the media of the cash recieve in transaction
apiRoutes.post('/CalcolaMediaEntrate', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, user) {
    if (ris)
      database.sumCashInside(user.numberOfAccount, function (result, data) {

        if (!result) {
          res.json({
            success: false,
            message: 'Riscontrati problemi nel database.'
          });
        }
        else
          if (!data)  //  if there's no movements
            res.json({
              success: true,
              message: 'Dati inviati correttamente.',
              data: 0
            });
          else {
            var date = new Date();
            var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

            var then = moment(user.dateOfCreation, "YYYY-MM-DD");
            var now = moment(today, "YYYY-MM-DD");
            //  get the difference in days
            var days = moment.duration(now.diff(then)).asDays();

            //  if the difference is negative
            if (days < 0) {
              res.json({
                success: false,
                message: 'Riscontrati problemi con le date nel database.'
              });
            }
            else {

              if (days == 0)
                days = 1;

              //  calculating spend average
              var ris = data.sumQuantity / days;
              console.log(ris);
              res.json({
                success: result,
                message: 'Dati inviati correttamente.',
                data: ris
              });
            }
          }
      });
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi nel database.'
      });
  });
});

//  Send alert
apiRoutes.post('/invio-avviso', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris)
      if (result.admin) {
        var date = new Date();
        var today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate() + 1 + "-" + date.getHours());

        database.maxNumberOfAdvise(function (num) {
          var numero = 0;

          if (num.length > 0)
            if (num[0].number != undefined)
              numero = (num[0].number + 1);

          var avviso = new Advise({
            number: numero,
            title: req.body.title,
            text: req.body.text,
            date: today
          });

          console.log("\n\nAvviso:\n" + avviso + "\n\n");

          database.addAdvise(avviso, function (result, messaggio) {
            if (result) {
              //  Sending email to interested people
              var servizioPosta = require('nodemailer');
              var postino = servizioPosta.createTransport({
                service: 'gmail',
                auth: {
                  user: 'banca.unicam@gmail.com',
                  pass: 'programmazioneweb'
                }
              });

              res.json({
                success: result,
                message: messaggio
              });

              //  Asking the DB for users list
              database.sortUsersByNumberOfAccount(function (result) {
                //  send email to every user
                result.forEach(function (user) {
                  postino.sendMail({
                    from: 'BANCA UNICAM',
                    to: user.email,
                    subject: req.body.title,
                    text: req.body.text
                  }, function (err, info) {
                    if (err)
                      console.log(err);
                    if (info)
                      console.log(info);
                  });

                }, this);
              });
            }
            else
              res.json({
                success: result,
                message: messaggio
              });
          });
        });
      }
      else {
        res.json({
          success: false,
          message: 'Impossibile inviare un avviso senza essere admin.'
        });
      }
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi con il database.'
      });
  });
});

//  delete alert
apiRoutes.post('/deleteAlert', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris)
      if (result.admin) {
        if (req.body.number != undefined) {
          database.deleteAdvise(req.body.number, function (ris, message) {
            res.json({
              success: ris,
              message: message
            });
          });
        }
        else
          res.json({
            success: false,
            message: 'Errore! Impossibile cancellare un avviso senza id.'
          });
      }
      else {
        res.json({
          success: false,
          message: 'Impossibile Impossibile cancellare un avviso senza essere admin.'
        });
      }
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi con il database.'
      });
  });
});

//  disable an account
apiRoutes.post('/off', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris)
      if (result.admin)
        database.findUserByAccount(req.body.n_account, function (ris, result) {
          if (ris)
            database.disactivateAccount(result, function (result, message) {
              if (result)
                res.json({
                  success: result,
                  message: message
                });
              else
                res.json({
                  success: false,
                  message: 'Riscontrati problemi nel database.'
                });
            });
          else
            res.json({
              success: false,
              message: 'L\'utente da disabilitare non esiste.'
            });
        });
      else
        res.json({
          success: false,
          message: 'Impossibile disabilitare un account senza essere admin.'
        });
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi nel database.'
      });
  });
});

//  enable an account
apiRoutes.post('/on', function (req, res) {
  database.findUserByAccount(req.decoded, function (ris, result) {
    if (ris)
      if (result.admin)
        database.findUserByAccount(req.body.n_account, function (ris, result) {
          if (ris)
            database.activateAccount(result, function (result, message) {
              if (result)
                res.json({
                  success: result,
                  message: message
                });
              else
                res.json({
                  success: false,
                  message: 'Riscontrati problemi nel database.'
                });
            });
          else
            res.json({
              success: false,
              message: 'L\'utente da abilitare non esiste.'
            });
        });
      else
        res.json({
          success: false,
          message: 'Impossibile abilitare un account senza essere admin.'
        });
    else
      res.json({
        success: false,
        message: 'Riscontrati problemi nel database.'
      });
  });
});

//  Insert PIN by administrator
apiRoutes.post('/InserisciPin-admin', function (req, res) {
  if (!req.body.pin) {
    res.json({
      success: false,
      message: 'Impossibile registrare senza il pin.'
    });

    return;
  }

  var pin = new Pin({
    number: req.body.pin,

    meta: {
      //  Name
      firstName: req.body.firstName,
      //  Surname
      lastName: req.body.lastName,
      //  Date of birth
      dateOfBirth: req.body.dateOfBirth,
      //  Phone number
      numberOfPhone: req.body.numberOfPhone,
      //  Residece
      residence: req.body.residence,
      //  Fiscal Code
      fiscalCode: req.body.fiscalCode
    },

    availableBalance: req.body.quantity || 0
  });

  database.insertPin(pin, function (result, messaggio) {
    res.json({
      success: result,
      message: messaggio
    });
  });
});

app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log("Node è in funzione sulla porta" + port);