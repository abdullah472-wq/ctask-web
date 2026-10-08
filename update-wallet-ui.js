const fs = require('fs');

let content = fs.readFileSync('src/app/[locale]/dashboard/wallet/page.tsx', 'utf8');

content = content.replace(
  /tx\.status === 'completed'\s*\?\s*'bg-green-500\/10 text-green-500'/,
  "tx.status === 'completed' || tx.status === 'paid' || tx.status === 'approved' ? 'bg-green-500/10 text-green-500'"
);

content = content.replace(
  /tx\.status === 'failed'\s*\?\s*'bg-red-500\/10 text-red-500'/,
  "tx.status === 'failed' || tx.status === 'rejected' ? 'bg-red-500/10 text-red-500'"
);

fs.writeFileSync('src/app/[locale]/dashboard/wallet/page.tsx', content);
