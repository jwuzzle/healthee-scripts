const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
require("dotenv").config();


const API_URL = process.env.API_URL_UPDATECONFIDENCE;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

const HEADERS = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
};

// Function to read the csv file
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const confidence = [];

        fs.createReadStream(filePath).pipe(csv()).on("data", (row) => {
            if (!row.npi || !row.uuid) {
                console.error("Skipping invalid row:", row);
            } else {
                confidence.push(row);
            }
        }).on("end", () => {
            console.log(`CSV file read successfully. Found ${confidence.length} locations with confidence.`);
            resolve(confidence);
        })
            .on("error", (error) => {
                reject(error);
            });
    });
};

//Fuction to send API request 
const addLocationConfidence = async (confidence) => {
    try {
        const data = {"confidence":2};
        console.log("Payload to be sent:", JSON.stringify(data, null, 2));
       
        //Test mode: prevents real API request
        const TEST_MODE = false;
        if (!TEST_MODE) {
            const response = await axios.put(`${API_URL}/${confidence.npi}/locations/${confidence.uuid}`, data, {
                headers: HEADERS
            });
            console.log(`Success: ${confidence.npi} ${confidence.uuid} added.`);
        } else {
            console.log("TEST MODE: No real API request sent.");
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

// Main function to process CSV and send API request 

const main = async () => {
    const filePath = './netcare_npi_uuid2.csv';

    const locations = await readCSV(filePath);

    for (const location of locations) {
        await addLocationConfidence(location);
    }
    console.log("Script execution completed.");
};


// Exectute Script
main();
