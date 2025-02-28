const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const { constants } = require("buffer");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require("dotenv").config();


const API_URL = process.env.API_URL;
const BEARER_TOKEN = process.env.BEARER_TOKEN;

const HEADERS = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    "Content-Type": "application/json",
};

// Function to read the csv file
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const addresses = [];
        
        fs.createReadStream(filePath).pipe(csv()).on("data", (row) => {
            if (!row.city || !row.state) {
                console.error("Skipping invalid row:", row);
            } else {
                addresses.push(row);
            }
        }).on("end", () => {
            console.log(`CSV file read successfully. Found ${addresses.length} addresses.`);
            resolve(addresses);
        })
            .on("error", (error) => {
                reject(error);
            });
    });

};

//Fuction to send API request 
const createLocationsAndExportCSV = async (address) => {
    try {
        const data = {
            address: address.street,
            address_details: {
                street: address.street,
                address_line_1: address.address_line_1,
                address_line_2: address.address_line_2,
                city: address.city,
                state: address.state,
                zip: address.zip
            },
        };
        console.log("Payload to be sent:", JSON.stringify(data, null, 2));

        //Test mode: prevents real API request
        const TEST_MODE = false;
        if (!TEST_MODE) {
            const response = await axios.post(API_URL, data, {
                headers: HEADERS
            });
            console.log(`Success: ${data.address} created.`);
    
            //writing a new csv with UUIDs that were created
            const returnedLocationUUID = response.data.data.uuid;
            const returnedAddress = response.data.data.address;

            const csvData = [{ address: returnedAddress, uuid: returnedLocationUUID }]
            const csvPath = 'netcare_custom_providers\locations_UUID.csv';
            const csvWriter = createCsvWriter({
                path: csvPath,
                header: [
                    { id: 'address', title: 'ADDRESS' },
                    { id: 'uuid', title: 'RIBBON_UUID' }
                ]
            });

            //write to CSV
            await csvWriter.writeRecords(csvData);
            console.log(`CSV file created with address and UUID: ${csvPath}`);
        } else {
            console.log("TEST MODE: No real API request sent.");
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

// Main function to process CSV and send API request 

const main = async () => {
    const filePath = './netcare_providers.csv';

    const addresses = await readCSV(filePath);

    for (const address of addresses) {
        await createLocationsAndExportCSV(address);
    }
    console.log("Script execution completed.");
};


// Exectute Script
main();
