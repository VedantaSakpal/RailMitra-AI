import { railradarService } from './src/services/railradar';
import * as fs from 'fs';

async function main() {
  try {
    const data = await railradarService.getTrainTimetable('99437', '2026-08-24');
    fs.writeFileSync('test_data.json', JSON.stringify(data, null, 2));
    console.log('Saved to test_data.json');
  } catch (err) {
    console.error(err);
  }
}

main();
