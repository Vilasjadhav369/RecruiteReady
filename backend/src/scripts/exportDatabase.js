import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
const OUTPUT_DIR = path.resolve(__dirname, '../../../database_export');

async function exportDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const fullDump = {};
    const summary = [];

    for (const col of collections) {
      const colName = col.name;
      // Skip system collections
      if (colName.startsWith('system.')) continue;

      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(OUTPUT_DIR, `${colName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      fullDump[colName] = docs;

      summary.push({ collection: colName, count: docs.length, file: `${colName}.json` });
      console.log(`  Exported ${colName}: ${docs.length} documents`);
    }

    // Write full database single file
    const fullDumpPath = path.join(OUTPUT_DIR, 'recruitready_full_database.json');
    fs.writeFileSync(fullDumpPath, JSON.stringify(fullDump, null, 2), 'utf-8');

    // Write README / Restore instructions
    const readmeContent = `# RecruitReady — Database Dump

This directory contains full JSON exports of each MongoDB collection from the \`recruiteready\` database.

## Summary of Collections
${summary.map((s) => `- **${s.collection}**: ${s.count} documents (\`${s.file}\`)`).join('\n')}

- **Combined Dump:** \`recruitready_full_database.json\` (all collections in one JSON file, readable by Claude)

## How to Restore to MongoDB
Run the restore script:
\`\`\`bash
node restoreDatabase.js
\`\`\`
Or import individual collections using \`mongoimport\`:
\`\`\`bash
mongoimport --uri="mongodb://127.0.0.1:27017/recruiteready" --collection=<collectionName> --file=<collectionName>.json --jsonArray
\`\`\`
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent, 'utf-8');

    // Create restore script in the export folder
    const restoreScriptContent = `import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';

async function restore() {
  console.log('Connecting to ' + MONGO_URI + '...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json') && f !== 'recruitready_full_database.json');

  for (const file of files) {
    const colName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf-8'));
    if (!Array.isArray(data) || data.length === 0) continue;

    console.log(\`Restoring \${colName} (\${data.length} records)...\`);
    await db.collection(colName).deleteMany({});
    await db.collection(colName).insertMany(data);
  }

  console.log('Restore complete!');
  await mongoose.disconnect();
}

restore().catch(console.error);
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'restoreDatabase.js'), restoreScriptContent, 'utf-8');

    console.log('\nDatabase export completed successfully to:', OUTPUT_DIR);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportDatabase();
