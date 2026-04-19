import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function updateSchema() {
    try {
        console.log(`Updating schema for database: ${databaseId}...`);
        
        await notion.databases.update({
            database_id: databaseId,
            properties: {
                'Description': {
                    rich_text: {}
                }
            }
        });
        
        console.log('🎉 Successfully added "Description" property to Notion database!');
    } catch (error) {
        console.error('❌ Failed to update schema:', error.message);
    }
}

updateSchema();
