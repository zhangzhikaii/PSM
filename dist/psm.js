"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
// Get the file name
function getCsvFilename(args) {
    const index = args.indexOf('--csvfile');
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return null;
}
// Adjust the return type to Promise
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const highPrices = [];
        const cheapPrices = [];
        const tooHighPrices = [];
        const tooCheapPrices = [];
        fs.createReadStream(filePath)
            .pipe((0, csv_parse_1.parse)({
            columns: true,
            delimiter: ',',
            trim: true,
            skip_empty_lines: true
        }))
            .on('data', (row) => {
            highPrices.push(parseFloat(row.高い));
            cheapPrices.push(parseFloat(row.安い));
            tooHighPrices.push(parseFloat(row.高すぎる));
            tooCheapPrices.push(parseFloat(row.安すぎる));
        })
            .on('end', () => {
            resolve({
                first: highPrices,
                second: cheapPrices,
                third: tooHighPrices,
                fourth: tooCheapPrices
            });
        })
            .on('error', (err) => {
            reject(err);
        });
    });
}
function Acc(pricelist, prices, sign) {
    const acc = [];
    for (let i = 0; i < pricelist.length - 1; i++) {
        let count = 0;
        // Count how many prices items are in the interval
        for (let j = 0; j < prices.length; j++) {
            if (sign === 1) {
                if (pricelist[i] < prices[j] && prices[j] <= pricelist[i + 1]) {
                    count += 1;
                }
            }
            else {
                if (pricelist[i] <= prices[j] && prices[j] < pricelist[i + 1]) {
                    count += 1;
                }
            }
        }
        // Initialize the first element correctly and handle general case
        if (i === 0) {
            // Cheap list start from 1, high list start from 0
            const initial_value = sign === 1 ? 0 : 1;
            acc.push(initial_value + (count !== 0 ? sign * count / prices.length : 0));
        }
        else {
            const newValue = acc[i - 1] + (count !== 0 ? sign * count / prices.length : 0);
            acc.push(newValue);
        }
    }
    return acc;
}
function findPoint(pricelist, line1, line2) {
    for (let i = 1; i < pricelist.length; i++) {
        if (line1[i] === line2[i]) {
            return pricelist[i];
        }
        else if (line1[i] < line2[i]) {
            const x1 = pricelist[i - 1];
            const y1 = line2[i - 1];
            const x2 = pricelist[i];
            const y2 = line2[i];
            const x3 = pricelist[i - 1];
            const y3 = line1[i - 1];
            const x4 = pricelist[i];
            const y4 = line1[i];
            const numerator = (y3 - y1) * (x1 - x2) * (x3 - x4) + x1 * (y1 - y2) * (x3 - x4) - x3 * (y3 - y4) * (x1 - x2);
            const denominator = (y1 - y2) * (x3 - x4) - (x1 - x2) * (y3 - y4);
            const x = numerator / denominator;
            return x;
            break;
        }
    }
    return undefined;
}
async function handleCsvData() {
    try {
        const csvFilename = getCsvFilename(process.argv);
        const csvPath = `./${csvFilename}.csv`;
        const outputs = await readCSV(csvPath);
        let pricelist = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
        let acchigh = Acc(pricelist, outputs.first, 1);
        let accCheap = Acc(pricelist, outputs.second, -1);
        let accToohigh = Acc(pricelist, outputs.third, 1);
        let accTooCheap = Acc(pricelist, outputs.fourth, -1);
        pricelist = pricelist.slice(1);
        let highestPrice = findPoint(pricelist, accCheap, accToohigh);
        let compromisedPrice = findPoint(pricelist, accCheap, acchigh);
        let idealPrice = findPoint(pricelist, accTooCheap, accToohigh);
        let assurancePrice = findPoint(pricelist, accTooCheap, acchigh);
        console.log(`Highest Price: ${highestPrice}`);
        console.log(`Compromised Price: ${compromisedPrice}`);
        console.log(`Ideal Price: ${idealPrice}`);
        console.log(`Assurance Price: ${assurancePrice}`);
    }
    catch (error) {
        console.error('An error occurred:', error);
    }
}
handleCsvData();
