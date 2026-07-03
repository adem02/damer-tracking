import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { join } from 'node:path';

expand(config({ path: join(__dirname, '..', '.env.test'), override: true }));
