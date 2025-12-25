/*
 * TEST LOGIN SCRIPT
 *
 * Test if worker login is working with the new passwords
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xuqvzlbfqdkfjjhdvzac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXZ6bGJmcWRrZmpqaGR2emFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODI2MTMsImV4cCI6MjA4MjE1ODYxM30.akHZLx4HAZwd0qQreDuOhLoh1WhCLjGvelw5CbyuSkU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWorkerLogin(workerId, password) {
    console.log(`🧪 Testing login for worker ${workerId} with password "${password}"`);

    try {
        // Fetch worker from database
        const { data: worker, error } = await supabase
            .from('workers')
            .select('*')
            .eq('worker_id', workerId)
            .single();

        if (error) {
            console.error(`❌ Database error for worker ${workerId}:`, error.message);
            return false;
        }

        if (!worker) {
            console.error(`❌ Worker ${workerId} not found`);
            return false;
        }

        console.log(`📋 Worker found: ${worker.name}`);
        console.log(`🔒 Stored hash: ${worker.password_hash?.substring(0, 30)}...`);

        // Test password with bcrypt
        const isValid = await bcrypt.compare(password, worker.password_hash);
        console.log(`🔍 Password valid: ${isValid ? '✅ YES' : '❌ NO'}`);

        return isValid;

    } catch (error) {
        console.error(`💥 Test failed for worker ${workerId}:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting login tests...\n');

    // Test cases
    const testCases = [
        { workerId: '1006', password: 'Ganesan@1006' },
        { workerId: '1007', password: 'Ramasamy@1007' },
        { workerId: '1011', password: 'Anthonisagayaraj@1011' },
        { workerId: '1033', password: 'A@1033' }, // Special case
        { workerId: '1006', password: 'wrongpassword' }, // Should fail
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        console.log(`\n--- Testing ${test.workerId} ---`);
        const result = await testWorkerLogin(test.workerId, test.password);

        if (result) {
            console.log(`✅ PASS: Login successful`);
            passed++;
        } else {
            console.log(`❌ FAIL: Login failed`);
            failed++;
        }
    }

    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Worker login is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the issues above.');
    }
}

// Run tests
runTests()
    .then(() => {
        console.log('\n🏁 Test script completed');
    })
    .catch((error) => {
        console.error('\n💥 Test script failed:', error);
    });
