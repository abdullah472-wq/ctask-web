const fs = require('fs');

let content = fs.readFileSync('src/app/[locale]/dashboard/layout.tsx', 'utf8');

if (!content.includes('Activity,')) {
  content = content.replace(
    "import {  \r\n  LayoutDashboard, ",
    "import {  \r\n  Activity,\r\n  LayoutDashboard, "
  );
  content = content.replace(
    "import {  \n  LayoutDashboard, ",
    "import {  \n  Activity,\n  LayoutDashboard, "
  );
}

fs.writeFileSync('src/app/[locale]/dashboard/layout.tsx', content);
