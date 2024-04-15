import * as fs from 'fs';
import {parse} from 'csv-parse';

// Define the structure of the CSV data
interface CsvData {
    高い: string;
    安い: string;
    高すぎる: string;
    安すぎる: string;
}

// Get the file name
function getCsvFilename(args: string[]): string | null {
    const index = args.indexOf('--csvfile');
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return null;
}

// Adjust the return type to Promise
function readCSV(filePath: string): Promise<{ first: number[]; second: number[]; third: number[]; fourth: number[] }> {
    return new Promise((resolve, reject) => {
        const highPrices: number[] = [];
        const cheapPrices: number[] = [];
        const tooHighPrices: number[] = [];
        const tooCheapPrices: number[] = [];

        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                delimiter: ',',
                trim: true,
                skip_empty_lines: true
            }))
            .on('data', (row: CsvData) => {
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


function Acc(pricelist: number[], prices: number[], sign: number): number[] {
    const acc: number[] = [];
    for (let i = 0; i < pricelist.length - 1; i++) {
        let count = 0;
        // Count how many prices items are in the interval
        for (let j = 0; j < prices.length; j++) {
            if (sign === 1) {
                if (pricelist[i] < prices[j] && prices[j] <= pricelist[i + 1]) {
                    count += 1;
                }
            } else {
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
        } else {
            const newValue = acc[i - 1] + (count !== 0 ? sign * count / prices.length : 0);
            acc.push(newValue);
        }
    }
    return acc;
}

function findPoint(pricelist: number[], line1: number[], line2: number[]): number | undefined {
    for (let i = 1; i < pricelist.length; i++) {
      if (line1[i] === line2[i]) {
        return pricelist[i];
      } else if (line1[i] < line2[i]) {
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

        let pricelist: number[] = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
        
        let acchigh = Acc(pricelist, outputs.first, 1);
        let accCheap = Acc(pricelist, outputs.second, -1);
        let accToohigh = Acc(pricelist, outputs.third, 1);
        let accTooCheap = Acc(pricelist, outputs.fourth, -1);

        pricelist = pricelist.slice(1);

        let highestPrice = findPoint(pricelist, accCheap, accToohigh);
        let compromisedPrice = findPoint(pricelist, accCheap, acchigh);
        let idealPrice = findPoint(pricelist, accTooCheap, accToohigh);
        let assurancePrice = findPoint(pricelist, accTooCheap, acchigh);

        console.log(`最高価格：${highestPrice?.toFixed(2)}円`);
        console.log(`妥協価格：${compromisedPrice?.toFixed(2)}円`);
        console.log(`理想価格：${idealPrice?.toFixed(2)}円`);
        console.log(`最低品質保証価格：${assurancePrice?.toFixed(2)}円`);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

handleCsvData();