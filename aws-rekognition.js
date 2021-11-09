
require('dotenv/config');
const express = require('express');
const app = express();
app.use(express.static('public'));

const bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))


// Configuring the aws SDK and region

const aws = require("aws-sdk")
aws.config.update({region:'us-east-2'});


// First function: Detect Labels
// This function detects all the available labels in an image such as: car, nature, fire, etc...
app.post('/detectLabels', function(request, response) {

    // Getting the bucket name from Amazon S3
    let bucketName = request.body.bucketname
    // Getting the image name from the bucket in Amazon S3
    let objectName = request.body.objectname


    // New Rekognition object
    let rekognition = new aws.Rekognition()

    let params = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: objectName
            }
        },
        // Maximum detected labels = 50
        MaxLabels: 50,
        // Confidence threshold = 80%
        MinConfidence: 80
    }

    rekognition.detectLabels(params, function (err, data){
        if (err){
            console.log(err, err.stack)
        } else {
            let table = "<table border=1>"
            for (var i=0; i < data.Labels.length; i++) {
                table += "<tr>";
                table += "<td>"+data.Labels[i].Name+"</td>"
                table += "<td>"+data.Labels[i].Confidence+"</td>"
                table += "</tr>"
            }
            table += "</table>"
            response.send(table)
        }
    })

})


// Second function: Image Moderation
// This function detects inappropriate content such as: drugs, weapons, explosions, etc...
app.post('/imageModeration', function(request, response) {

    let bucketName = request.body.bucketname
    let objectName = request.body.objectname

    let rekognition = new aws.Rekognition()

    let params = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: objectName
            }
        },
        MinConfidence: 80
    }

    rekognition.detectModerationLabels(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            var table = "<table border=1>"
            for (var i=0; i < data.ModerationLabels.length; i++) {
                table += "<tr>";
                table += "<td>"+data.ModerationLabels[i].Name+"</td>"
                table += "<td>"+data.ModerationLabels[i].Confidence+"</td>"
                table += "</tr>"
            }
            table += "</table>"
            response.send(table);
        }
    });
});

// Third function: Facial Analysis
// This function detects the facial expression in an image
app.post('/facialAnalysis', function(request, response) {

    let bucketName = request.body.bucketname
    let objectName = request.body.objectname

    let rekognition = new aws.Rekognition()

    let params = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: objectName
            }
        },
        Attributes: ['ALL']
    }

    rekognition.detectFaces(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            var table = "<table border=1>"
            for (var i=0; i < data.FaceDetails.length; i++) {
                table += "<tr>";
                table += "<td>"+data.FaceDetails[i].AgeRange.Low+"</td>";
                table += "<td>"+data.FaceDetails[i].AgeRange.High+"</td>";
                table += "<td>"+data.FaceDetails[i].Gender.Value+"</td>";
                table += "<td>"+data.FaceDetails[i].Emotions[0].Type+"</td>";
                table += "</tr>"
            }
            table += "</table>"
            response.send(table);
        }
    });
});

// Fourth function: Celebrity Recognition
// This function detects the name of a celebrity in an image
app.post('/celebrity', function(request, response) {

    let bucketName = request.body.bucketname
    let objectName = request.body.objectname

    let rekognition = new aws.Rekognition()

    let params = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: objectName
            }
        },
    }

    rekognition.recognizeCelebrities(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            var table = "<table border=1>"
            for (var i=0; i < data.CelebrityFaces.length; i++) {
                table += "<tr>";
                table += "<td>"+data.CelebrityFaces[i].Name+"</td>";
                table += "<td>"+data.CelebrityFaces[i].MatchConfidence+"</td>";
                table += "<td>"+data.CelebrityFaces[i].Urls[0]+"</td>";
                table += "</tr>"
            }
            table += "</table>"
            response.send(table);
        }
    });
});

// Fifth function: Text in Image
// This function detects any typed text in an image
app.post('/textImage', function(request, response) {

    let bucketName = request.body.bucketname
    let objectName = request.body.objectname

    let rekognition = new aws.Rekognition()

    let params = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: objectName
            }
        },
    }

    rekognition.detectText(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            var table = "<table border=1>"
            for (var i=0; i < data.TextDetections.length; i++) {
                table += "<tr>";
                table += "<td>"+data.TextDetections[i].DetectedText+"</td>";
                table += "<td>"+data.TextDetections[i].Type+"</td>";
                table += "<td>"+data.TextDetections[i].Confidence+"</td>";
                table += "</tr>"
            }
            table += "</table>"
            response.send(table);
        }
    });
});

// Sixth function
// This function compares two images and return a similarity percentage of the persons
app.post('/faceCompare', function(request, response) {

    let bucketName = request.body.bucketname
    let faceone    = request.body.faceone
    let facetwo    = request.body.facetwo

    let rekognition = new aws.Rekognition()

    var params = {
        SourceImage: {
            S3Object: {
                Bucket: bucketName,
                Name: faceone
            }
        },
        TargetImage: {
            S3Object: {
                Bucket: bucketName,
                Name: facetwo
            }
        },
        SimilarityThreshold: 80
    };

    rekognition.compareFaces(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            var table = "<table border=1>"
            for (var i=0; i < data.FaceMatches.length; i++) {
                table += "<tr>";
                table += "<td>"+data.FaceMatches[i].Similarity+"</td>";
                table += "</tr>"
            }
            table += "</table>"
            response.send(table);
        }
    });
});

// Main Route to Main HTML Page
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
const listener = app.listen(8089, function() {
    console.log('Your app is listening on port 8089');
});


