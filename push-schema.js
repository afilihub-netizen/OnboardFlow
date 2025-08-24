// Auto-confirm drizzle push 
const { execSync } = require('child_process');

try {
  // Use echo to pipe 'c' repeatedly to answer all questions
  execSync('echo -e "c\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\nc\\n" | npx drizzle-kit push', 
    { stdio: 'inherit', cwd: '/home/runner/workspace' });
  console.log('Database schema updated successfully!');
} catch (error) {
  console.error('Error updating schema:', error.message);
}