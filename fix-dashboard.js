const fs = require('fs');
const path = require('path');

// Fix staff dashboard JSX syntax error
const sourceFile = path.join(__dirname, 'app/staff-dashboard/page-fixed.tsx');
const targetFile = path.join(__dirname, 'app/staff-dashboard/page.tsx');

try {
  const content = fs.readFileSync(sourceFile, 'utf8');
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✓ Staff dashboard fixed successfully!');
  console.log('✓ page.tsx has been updated with correct JSX syntax');
  console.log('\nNext: Run "npm run build" to verify');
} catch (error) {
  console.error('✗ Error fixing dashboard:', error.message);
  process.exit(1);
}
