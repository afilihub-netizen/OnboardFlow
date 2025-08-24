import { execSync } from 'child_process';

try {
  console.log('Updating database schema...');
  execSync('npm run db:push -- --force', { stdio: 'inherit', cwd: '/home/runner/workspace' });
  console.log('Database schema updated successfully!');
} catch (error) {
  console.error('Error updating schema:', error.message);
  process.exit(1);
}