/**
 * Script to clean up test data after testing
 * Run with: node scripts/cleanup-test-data.js
 * 
 * This deletes:
 * - Test tournaments (marked with [TEST] prefix)
 * - Test teams (marked with [TEST] prefix)
 * - Test matches (from test tournaments)
 * 
 * IMPORTANT: Only deletes data with [TEST] prefix to avoid deleting production data
 */

// Note: This would need to be run in a Node.js environment with Firebase Admin SDK
// For manual cleanup, use the app UI to delete test data

console.log('🧹 Test Data Cleanup Script');
console.log('===========================\n');
console.log('This script is a reference for cleaning up test data.');
console.log('For actual cleanup, please delete test data through the app UI.\n');
console.log('Test Data to Delete:');
console.log('1. All tournaments with [TEST] prefix in name');
console.log('2. All teams with [TEST] prefix in name');
console.log('3. All matches from test tournaments');
console.log('4. Test user accounts (optional)\n');
console.log('IMPORTANT: Only delete data marked with [TEST] prefix!\n');


