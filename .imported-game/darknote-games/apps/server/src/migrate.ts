import 'dotenv/config';
import { migrate } from './db';
migrate().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
