#!/usr/bin/env node

/**
 * 检查similaritySegments表的数据
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = 'mysql://3xmRkFJxqhUHkEfRQqwpAZfCKLxqpqxD:aMUKXXgXmwIgYqWBBQJJPvjqKZOGlQIW@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/doc_similarity?ssl={"rejectUnauthorized":true}';

async function main() {
  console.log('[Check] Connecting to database...');
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  try {
    // 查询analysisResults表
    console.log('\n[Check] Querying analysisResults table...');
    const [results] = await connection.query('SELECT id, taskId, overallSimilarity FROM analysisResults ORDER BY id DESC LIMIT 5');
    console.log(`[Check] Found ${results.length} analysis results:`);
    console.table(results);
    
    // 查询similaritySegments表
    console.log('\n[Check] Querying similaritySegments table...');
    const [segments] = await connection.query('SELECT id, resultId, doc1Id, doc2Id, similarity, LEFT(doc1Segment, 50) as doc1Preview, LEFT(doc2Segment, 50) as doc2Preview FROM similaritySegments ORDER BY id DESC LIMIT 10');
    console.log(`[Check] Found ${segments.length} similarity segments:`);
    console.table(segments);
    
    // 检查最新result的segments
    if (results.length > 0) {
      const latestResultId = results[0].id;
      console.log(`\n[Check] Checking segments for latest result (ID: ${latestResultId})...`);
      const [latestSegments] = await connection.query('SELECT COUNT(*) as count FROM similaritySegments WHERE resultId = ?', [latestResultId]);
      console.log(`[Check] Latest result has ${latestSegments[0].count} segments`);
      
      if (latestSegments[0].count > 0) {
        const [details] = await connection.query('SELECT id, similarity, LEFT(doc1Segment, 100) as doc1, LEFT(doc2Segment, 100) as doc2 FROM similaritySegments WHERE resultId = ? ORDER BY similarity DESC', [latestResultId]);
        console.log('[Check] Segment details:');
        console.table(details);
      }
    }
    
    console.log('\n[Check] ✅ Check completed');
    
  } catch (error) {
    console.error('[Check] ❌ Error:', error);
  } finally {
    await connection.end();
  }
}

main();
