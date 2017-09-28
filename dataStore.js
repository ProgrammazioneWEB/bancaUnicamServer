var fs = require('fs');
FileUploadController = function () { };

var localPath = 'https://bancaunicam.herokuapp.com/userPic/';

FileUploadController.prototype.uploadFile = function (req, res, next) {

  fs.readFile(req.files.file.path, function (err, data) {
    if (err) {
      res.json({
        success: false,
        message: 'Errore nella lettura dela foto.'
      });
      return;
    }

    var file = req.files.file;
    var dati = data;

    fs.readFile(localPath + file.name, function (err, data) {
      if (err) {
        file.path = localPath + file.name;

        fs.writeFile(file.path, dati, function (err) {
          if (err) {
            res.json({
              success: false,
              message: 'Errore nello spostamento della foto.'
            });
            return console.warn(err);
          }
          console.log("\nNuova foto salvata:" + file.path);
          req.name = file.name;
          req.success = true;
          next();
        });
      }
      else
        res.json({
          success: false,
          message: 'Esiste già una foto con questo nome.'
        });
    });
  });
}

module.exports = new FileUploadController();