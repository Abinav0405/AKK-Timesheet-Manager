/*
 * WORKING PASSWORD UPDATE SCRIPT
 *
 * This script actually connects to Supabase and updates all worker passwords
 * to the format: Firstname@ID
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xuqvzlbfqdkfjjhdvzac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXZ6bGJmcWRrZmpqaGR2emFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODI2MTMsImV4cCI6MjA4MjE1ODYxM30.akHZLx4HAZwd0qQreDuOhLoh1WhCLjGvelw5CbyuSkU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateWorkerPasswords() {
    console.log('🔄 Connecting to Supabase and updating passwords...\n');

    try {
        // Fetch all workers
        console.log('📡 Fetching worker data...');
        const { data: workers, error: workersError } = await supabase
            .from('workers')
            .select('worker_id, name, password_hash');

        if (workersError) {
            console.error('❌ Workers fetch error:', workersError.message);
            return;
        }

        // Fetch all worker details
        const { data: workerDetails, error: detailsError } = await supabase
            .from('worker_details')
            .select('employee_id, employee_name');

        if (detailsError) {
            console.error('❌ Worker details fetch error:', detailsError.message);
            return;
        }

        // Join workers with worker_details in JavaScript
        const workersWithDetails = workers.map(worker => {
            const details = workerDetails.find(detail => detail.employee_id === worker.worker_id);
            return {
                ...worker,
                worker_details: details
            };
        });

        if (!workersWithDetails || workersWithDetails.length === 0) {
            console.log('⚠️ No workers found in database');
            return;
        }

        console.log(`✅ Found ${workersWithDetails.length} workers to update\n`);

        let updatedCount = 0;
        let errorCount = 0;

        // Process each worker
        for (const worker of workersWithDetails) {
            try {
                const workerId = worker.worker_id;
                const currentHash = worker.password_hash;
                const employeeName = worker.worker_details?.employee_name;

                if (!employeeName) {
                    console.warn(`⚠️ Skipping ${workerId}: No employee name found`);
                    errorCount++;
                    continue;
                }

                // Generate new password: Firstname@ID
                const firstName = employeeName.split(' ')[0];
                const newPassword = `${firstName}@${workerId}`;

                console.log(`🔄 Updating ${workerId}: ${employeeName} → Password: ${newPassword}`);

                // Hash the new password
                const saltRounds = 10;
                const newHash = await bcrypt.hash(newPassword, saltRounds);

                // Update in database
                const { error: updateError } = await supabase
                    .from('workers')
                    .update({ password_hash: newHash })
                    .eq('worker_id', workerId);

                if (updateError) {
                    console.error(`❌ Failed to update ${workerId}:`, updateError.message);
                    errorCount++;
                } else {
                    console.log(`✅ Updated ${workerId}: ${currentHash?.substring(0, 20)}... → ${newHash.substring(0, 20)}...`);
                    updatedCount++;
                }

            } catch (workerError) {
                console.error(`❌ Error processing ${worker.worker_id}:`, workerError.message);
                errorCount++;
            }
        }

        // Summary
        console.log('\n📊 UPDATE SUMMARY');
        console.log('='.repeat(30));
        console.log(`✅ Successfully updated: ${updatedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📋 Total processed: ${workersWithDetails.length}`);

        if (updatedCount > 0) {
            console.log('\n🔑 NEW LOGIN FORMAT');
            console.log('='.repeat(30));
            console.log('Workers can now login with: Firstname@WorkerID');
            console.log('\n📝 Examples:');
            console.log('  Ganesan@1006');
            console.log('  Ramasamy@1007');
            console.log('  Anthonisagayaraj@1011');
            console.log('\n🎯 Test with any worker ID + their new password!');
        }

    } catch (error) {
        console.error('💥 Fatal error:', error.message);
        console.error('Make sure:');
        console.error('1. Your Supabase URL and key are correct');
        console.error('2. The workers and worker_details tables exist');
        console.error('3. You have internet connection');
    }
}

// Run the script
console.log('🚀 Starting password update script...\n');

updateWorkerPasswords()
    .then(() => {
        console.log('\n🏁 Script finished successfully!');
        console.log('You can now test worker login with the new passwords.');
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
