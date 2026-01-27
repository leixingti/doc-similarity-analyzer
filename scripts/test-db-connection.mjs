#!/usr/bin/env node

/**
 * 数据库连接测试脚本
 * 用于验证数据库连接和基本查询功能
 */

import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2SDxeZiTrYjeW97.root',
  password: 'E8io4SjtjPyWNHLA',
  database: 'test',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
};

async function testConnection() {
  console.log('🔍 开始测试数据库连接...\n');
  
  let pool;
  try {
    // 1. 创建连接池
    console.log('1️⃣ 创建连接池...');
    pool = mysql.createPool(config);
    console.log('   ✅ 连接池创建成功\n');
    
    // 2. 测试连接
    console.log('2️⃣ 测试数据库连接...');
    const connection = await pool.getConnection();
    console.log('   ✅ 连接获取成功');
    connection.release();
    console.log('   ✅ 连接释放成功\n');
    
    // 3. 测试查询
    console.log('3️⃣ 测试基本查询...');
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('   ✅ 查询执行成功:', rows);
    console.log('');
    
    // 4. 测试users表
    console.log('4️⃣ 测试users表查询...');
    try {
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log('   ✅ users表查询成功, 用户数:', users[0].count);
    } catch (error) {
      console.log('   ⚠️  users表查询失败:', error.message);
    }
    console.log('');
    
    // 5. 测试参数化查询
    console.log('5️⃣ 测试参数化查询...');
    try {
      const testEmail = 'test@example.com';
      const [result] = await pool.query(
        'SELECT * FROM users WHERE email = ? LIMIT ?',
        [testEmail, 1]
      );
      console.log('   ✅ 参数化查询成功, 结果数:', result.length);
    } catch (error) {
      console.log('   ❌ 参数化查询失败:', error.message);
      console.log('   错误详情:', error);
    }
    console.log('');
    
    console.log('✅ 所有测试完成!\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔚 连接池已关闭');
    }
  }
}

// 运行测试
testConnection().catch(console.error);
