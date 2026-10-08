const fs = require('fs');

let content = fs.readFileSync('src/app/admin/activity-logs/page.tsx', 'utf8');

content = content.replace(
  /\$\{log\.status === 'paid' \|\| log\.status === 'approved'/,
  "${log.status === 'paid' || log.status === 'completed' || log.status === 'approved'"
);

content = content.replace(
  /: log\.status === 'rejected'/,
  ": log.status === 'rejected' || log.status === 'failed'"
);

fs.writeFileSync('src/app/admin/activity-logs/page.tsx', content);
