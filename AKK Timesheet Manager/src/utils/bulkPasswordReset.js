/*
 * BULK PASSWORD RESET UTILITY
 *
 * This script resets all existing worker passwords to the format: Firstname@ID
 *
 * Usage: Run this once after setting up worker_details table
 * Example: node src/utils/bulkPasswordReset.js
 */

import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - REPLACE WITH YOUR ACTUAL KEYS
const supabaseUrl = 'https://xuqvzlbfqdkfjjhdvzac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXZ6bGJmcWRrZmpqZGR2emFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTEwNTU4MCwiZXhwIjoyMDUwNjgxNTgwfQ.8R5VQ4FxXwGj3p5l4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function bulkResetWorkerPasswords() {
    console.log('🔄 Starting bulk password reset...');

    try {
        // Fetch all workers with their details
        const { data: workers, error } = await supabase
            .from('workers')
            .select(`
                worker_id,
                name,
                worker_details!inner(employee_id, employee_name)
            `)
            .eq('workers.worker_id', 'worker_details.employee_id');

        if (error) {
            console.error('❌ Error fetching workers:', error);
            return;
        }

        if (!workers || workers.length === 0) {
            console.log('⚠️ No workers found to reset passwords for');
            return;
        }

        console.log(`📋 Found ${workers.length} workers to process`);

        let successCount = 0;
        let errorCount = 0;

        // Process each worker
        for (const worker of workers) {
            try {
                const workerId = worker.worker_id;
                const employeeName = worker.worker_details?.employee_name;

                if (!employeeName) {
                    console.warn(`⚠️ Skipping worker ${workerId}: No employee_name found`);
                    errorCount++;
                    continue;
                }

                // Generate default password: Firstname@ID
                const firstName = employeeName.split(' ')[0];
                const defaultPassword = `${firstName}@${workerId}`;

                console.log(`🔐 Generating password for ${employeeName} (${workerId}): ${firstName}@${workerId}`);

                // Hash the password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

                // Update the password hash in database
                const { error: updateError } = await supabase
                    .from('workers')
                    .update({ password_hash: hashedPassword })
                    .eq('worker_id', workerId);

                if (updateError) {
                    console.error(`❌ Failed to update password for ${workerId}:`, updateError);
                    errorCount++;
                } else {
                    console.log(`✅ Successfully reset password for ${employeeName} (${workerId})`);
                    successCount++;
                }

            } catch (workerError) {
                console.error(`❌ Error processing worker ${worker.worker_id}:`, workerError);
                errorCount++;
            }
        }

        console.log('\n📊 Bulk password reset completed!');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`\n🔑 Workers can now log in with format: Firstname@WorkerID`);
        console.log(`📝 Example: Ganesan@1006, Ramasamy@1007, etc.`);

    } catch (error) {
        console.error('❌ Fatal error during bulk reset:', error);
    }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    bulkResetWorkerPasswords()
        .then(() => {
            console.log('🏁 Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

export { bulkResetWorkerPasswords };
