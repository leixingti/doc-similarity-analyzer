/**
 * 自动化测试脚本 - 文档相似度分析系统
 * 
 * 使用方法:
 * node test_scenarios.js
 * 
 * 或使用 Playwright:
 * npx playwright test
 */

const http = require('http');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api/trpc',
  timeout: 30000,
};

// 测试用户
const testUsers = {
  user1: {
    email: 'testuser1@example.com',
    password: 'password123',
    name: 'testuser1',
  },
  user2: {
    email: 'testuser2@example.com',
    password: 'password456',
    name: 'testuser2',
  },
  admin: {
    email: 'admin@system.local',
    password: 'admin123',
    name: 'admin',
  },
};

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

/**
 * 发送 HTTP 请求
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: config.timeout,
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 测试用例
 */
const testCases = [
  {
    name: '测试 1: 新用户注册',
    async run() {
      console.log('\n🧪 运行测试: 新用户注册');
      
      try {
        const response = await makeRequest('POST', '/userManagement.register', {
          email: testUsers.user1.email,
          name: testUsers.user1.name,
          password: testUsers.user1.password,
        });

        if (response.status === 200 && response.data.result?.data?.token) {
          console.log('✅ 注册成功');
          console.log('   - Token 已返回');
          console.log('   - 用户信息:', response.data.result.data.user);
          return { passed: true, token: response.data.result.data.token };
        } else {
          console.log('❌ 注册失败');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 注册错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },

  {
    name: '测试 2: 用户登录',
    async run() {
      console.log('\n🧪 运行测试: 用户登录');
      
      try {
        const response = await makeRequest('POST', '/userManagement.login', {
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        });

        if (response.status === 200 && response.data.result?.data?.token) {
          console.log('✅ 登录成功');
          console.log('   - Token 已返回');
          console.log('   - 用户信息:', response.data.result.data.user);
          return { passed: true, token: response.data.result.data.token };
        } else {
          console.log('❌ 登录失败');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 登录错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },

  {
    name: '测试 3: 获取当前用户信息',
    async run(token) {
      console.log('\n🧪 运行测试: 获取当前用户信息');
      
      if (!token) {
        console.log('⏭️  跳过: 没有有效的 token');
        return { passed: false, skipped: true };
      }

      try {
        const response = await makeRequest('POST', '/auth.me', null, token);

        if (response.status === 200 && response.data.result?.data) {
          console.log('✅ 获取用户信息成功');
          console.log('   - 用户:', response.data.result.data.email);
          console.log('   - 角色:', response.data.result.data.role);
          return { passed: true, user: response.data.result.data };
        } else {
          console.log('❌ 获取用户信息失败');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 获取用户信息错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },

  {
    name: '测试 4: 无效 Token 访问',
    async run() {
      console.log('\n🧪 运行测试: 无效 Token 访问');
      
      try {
        const response = await makeRequest('POST', '/auth.me', null, 'invalid_token');

        if (response.status === 401 || response.data.error) {
          console.log('✅ 正确拒绝无效 Token');
          console.log('   - 状态码:', response.status);
          return { passed: true };
        } else {
          console.log('❌ 应该拒绝无效 Token');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 测试错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },

  {
    name: '测试 5: 重复注册相同邮箱',
    async run() {
      console.log('\n🧪 运行测试: 重复注册相同邮箱');
      
      try {
        const response = await makeRequest('POST', '/userManagement.register', {
          email: testUsers.user1.email,
          name: 'duplicate_user',
          password: 'password123',
        });

        if (response.status !== 200 || response.data.error) {
          console.log('✅ 正确拒绝重复注册');
          console.log('   - 错误信息:', response.data.error?.message);
          return { passed: true };
        } else {
          console.log('❌ 应该拒绝重复注册');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 测试错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },

  {
    name: '测试 6: 错误的登录凭证',
    async run() {
      console.log('\n🧪 运行测试: 错误的登录凭证');
      
      try {
        const response = await makeRequest('POST', '/userManagement.login', {
          email: testUsers.user1.email,
          password: 'wrong_password',
        });

        if (response.status !== 200 || response.data.error) {
          console.log('✅ 正确拒绝错误凭证');
          console.log('   - 错误信息:', response.data.error?.message);
          return { passed: true };
        } else {
          console.log('❌ 应该拒绝错误凭证');
          console.log('   - 响应:', response);
          return { passed: false };
        }
      } catch (error) {
        console.log('❌ 测试错误:', error.message);
        return { passed: false, error: error.message };
      }
    },
  },
];

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('文档相似度分析系统 - 自动化测试');
  console.log('='.repeat(60));
  console.log('\n📝 测试配置:');
  console.log('   - 基础 URL:', config.baseUrl);
  console.log('   - API URL:', config.apiUrl);
  console.log('   - 超时时间:', config.timeout, 'ms');

  let token = null;

  for (const testCase of testCases) {
    try {
      const result = await testCase.run(token);

      if (result.skipped) {
        testResults.skipped++;
      } else if (result.passed) {
        testResults.passed++;
        if (result.token) {
          token = result.token;
        }
      } else {
        testResults.failed++;
        if (result.error) {
          testResults.errors.push(`${testCase.name}: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - 异常:`, error.message);
      testResults.failed++;
      testResults.errors.push(`${testCase.name}: ${error.message}`);
    }
  }

  // 打印总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`⏭️  跳过: ${testResults.skipped}`);
  console.log(`📈 通过率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n⚠️  错误详情:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
