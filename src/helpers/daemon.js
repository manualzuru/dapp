// global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

import SpaceClient from '@fleekhq/space-client'

const client = new SpaceClient({url: `http://0.0.0.0:9998`});

// for testing
const bucketName = "bucket" + Date.now();
const pathname = "path" + Date.now()

exports.createBucket = async() => {
const bucketResponse = await client.createBucket({slug: bucketName});
return bucketResponse.getBucket();
}

exports.shareBucket = async () => {
// bucket sharing details to be saved in  3box/any other alternative
const sharingResponse = await client.shareBucket({bucketName});
return sharingResponse.getThreadinfo();
}

exports.uploadFile = async () => {
    // uploading file to bucket have to integrate with button
    const stream = await client.addItems({
    bucket: bucketName, targetPath: "/", // path in the bucket to be saved
    // sample
    sourcePaths: ["G:/Node-Down-Time-App/Nodes.csv"]
    });
    // events to capture the file uploading journey
    await stream.on("data", (data) => {
    console.log("data: ", data);
    });

    await stream.on("error", (error) => {
    console.error("error: ", error);
    });

    await stream.on("end", () => {
    console.log("end");
    });
}





