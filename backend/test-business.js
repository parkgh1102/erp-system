// Simple test to check business relationships
console.log('Testing business access...');

// Simulate the ProductController logic
const userId = 2;
const businessId = 3;

console.log(`Testing: userId=${userId}, businessId=${businessId}`);
console.log('This should help us understand the business relationship issue.');

// The core logic from ProductController
console.log('ProductController logic:');
console.log('1. Get userId from req.user?.userId (should be 2)');
console.log('2. Get businessId from req.params (should be 3)');
console.log('3. Query: businessRepository.findOne({ where: { id: parseInt(businessId), userId } })');
console.log('4. This query fails, but other controllers with same logic succeed');

console.log('\nBased on the evidence:');
console.log('- Dashboard API works with same business ID 3');
console.log('- Customer API works with same business ID 3');
console.log('- Sales API works with same business ID 3');
console.log('- Only Products API fails');

console.log('\nSolution: Modify ProductController to match other working controllers');