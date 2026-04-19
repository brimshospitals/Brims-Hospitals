const fs = require('fs');
const path = require('path');

const oldFile = path.join(__dirname, 'app/staff-dashboard/page.tsx');
const fixedFile = path.join(__dirname, 'app/staff-dashboard/page-fixed.tsx');

try {
  // Read fixed file
  const content = fs.readFileSync(fixedFile, 'utf8');
  
  // Write to original location
  fs.writeFileSync(oldFile, content, 'utf8');
  
  console.log('✅ File replacement successful!');
  console.log('Old page.tsx has been replaced with the corrected version');
  
  // Clean up - remove the -fixed version
  if (fs.existsSync(fixedFile)) {
    fs.unlinkSync(fixedFile);
    console.log('✅ Cleanup: removed page-fixed.tsx');
  }
  
  console.log('\nNext step: Run "npm run build" to verify the fix');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
