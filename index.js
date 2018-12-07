'use strict';
// COS Adapter
//
// Stores Parse files in Tencent Cloud COS.

// var AWS = require('aws-sdk');
var COS = require('cos-nodejs-sdk-v5');
var optionsFromArguments = require('./lib/optionsFromArguments');
var fs = require('fs');
// Creates an COS session.
// Providing Tencent Cloud access, secret keys and bucket are mandatory
// Region will use same defaults if omitted
function COSAdapter() {

    var options = optionsFromArguments(arguments);
    this._Region = options.Region;
    this._Bucket = options.Bucket;
    // this._bucketPrefix = options.bucketPrefix;
    // this._directAccess = options.directAccess;
    // this._baseUrl = options.baseUrl;
    // this._baseUrlDirect = options.baseUrlDirect;
    // this._signatureVersion = options.signatureVersion;
    this._globalCacheControl = options.globalCacheControl;
    // this._encryption = options.ServerSideEncryption;

    let COSOptions = {
        params: { Bucket: this._Bucket },
        region: this._Region,
        signatureVersion: this._signatureVersion,
        globalCacheControl: this._globalCacheControl
    };

    if (options.SecretId && options.SecretKey) {
        COSOptions.SecretId = options.SecretId;
        COSOptions.SecretKey = options.SecretKey;
    }

    // Object.assign(COSOptions, options.s3overrides);

    this._cosClient = new COS(COSOptions);
    // this._s3Client = new AWS.S3(COSOptions);
}


// For a given config object, filename, and data, store a file in S3
// Returns a promise containing the S3 object creation response
COSAdapter.prototype.createFile = function(filename, data, contentType) {
    let params = {
        Bucket: this._Bucket,
        Region: this._Region,
        Key: filename,
        Body:Buffer.from(data)
    };
    if (contentType) {
        params.ContentType = contentType;
    }
    if(this._globalCacheControl) {
        params.CacheControl = this._globalCacheControl;
    }
    return new Promise((resolve, reject) => {
        this._cosClient.putObject(params, (err, data) => {
            if (err !== null) {
                return reject(err);
            }
            resolve(data);
        });
    });

}

COSAdapter.prototype.deleteFile = function(filename) {
    return new Promise((resolve, reject) => {
        let params = {
            Bucket: this._Bucket,
            Region: this._Region,
            Key: filename,
        };
        this._cosClient.deleteObject(params, (err, data) =>{
            if(err !== null) {
                return reject(err);
            }
            resolve(data);
        });
    });

}

// Search for and return a file if found by filename
// Returns a promise that succeeds with the buffer result from S3
COSAdapter.prototype.getFileData = function(filename) {
    let params = {
        Bucket: this._Bucket,
        Region: this._Region,
        Key: filename,
    };
    return new Promise((resolve, reject) => {
        this._cosClient.getObject(params, (err, data) => {
            if (err !== null) {
                return reject(err);
            }
            // Something happened here...
            if (data && !data.Body) {
                return reject(data);
            }
            resolve(data.Body);
        });
    });
}

// Generates and returns the location of a file stored in S3 for the given request and filename
// The location is the direct S3 link if the option is set, otherwise we serve the file through parse-server
COSAdapter.prototype.getFileLocation = function(config, filename) {
    filename = encodeURIComponent(filename);
    return (config.mount + '/files/' + config.applicationId + '/' + filename);
}

module.exports = COSAdapter;
module.exports.default = COSAdapter;
