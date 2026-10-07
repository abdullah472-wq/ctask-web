const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Add import
content = content.replace(
  "import { UserAvatar } from '@/components/UserAvatar';",
  "import { UserAvatar } from '@/components/UserAvatar';\nimport { NotificationBell } from '@/components/NotificationBell';"
);

// Replace inline bell with component
// We can find it by looking for {/* Notification Bell */} and replacing until we find User Profile Menu or similar.
const bellStart = content.indexOf('{/* Notification Bell */}');
if (bellStart !== -1) {
  // find the end of the relative div for the bell.
  // It's followed by User Profile Menu which looks like this:
  const profileMenuStart = content.indexOf('{/* User Profile Menu */}', bellStart);
  
  if (profileMenuStart !== -1) {
    const originalBellBlock = content.substring(bellStart, profileMenuStart);
    content = content.replace(originalBellBlock, '{profile && <NotificationBell userId={profile.id} />}\n\n            ');
  }
}

fs.writeFileSync('src/app/dashboard/layout.tsx', content);
console.log('done layout update');
