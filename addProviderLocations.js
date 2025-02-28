const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
require("dotenv").config();


const API_URL = process.env.API_URL_ADDPROVLOC;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

const HEADERS = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
};

// Function to read the csv file
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const locations = [];

        fs.createReadStream(filePath).pipe(csv()).on("data", (row) => {
            if (!row.npi || !row.uuid) {
                console.error("Skipping invalid row:", row);
            } else {
                locations.push(row);
            }
        }).on("end", () => {
            console.log(`CSV file read successfully. Found ${locations.length} locations.`);
            resolve(locations);
        })
            .on("error", (error) => {
                reject(error);
            });
    });
};

//Fuction to send API request 
const addProviderLocations = async (locations) => {
    try {
        const data = {
            add: [locations.uuid]
        };
        console.log("Payload to be sent:", JSON.stringify(data, null, 2));
    
        //Test mode: prevents real API request
        const TEST_MODE = false;
        if (!TEST_MODE) {
            const response = await axios.put(`${API_URL}/${locations.npi}/locations`, data, {
                headers: HEADERS
            });
            console.log(`Success: ${locations.npi} ${locations.uuid} added.`);
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
        await addProviderLocations(location);
    }
    console.log("Script execution completed.");
};


// Exectute Script
main();
