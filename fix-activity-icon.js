const fs = require('fs');

let content = fs.readFileSync('src/app/[locale]/dashboard/layout.tsx', 'utf8');

// 1. Remove Activity from react import
content = content.replace(
  "import { Activity, useEffect, useState, useRef } from 'react';",
  "import { useEffect, useState, useRef } from 'react';"
);

// 2. Add Activity to lucide-react import
if (!content.includes('Activity') && content.includes('lucide-react')) {
  // It's already there? Wait, let's just make sure it is in lucide-react
}

const lucideImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+'lucide-react';/);
if (lucideImportMatch) {
  let lucideImports = lucideImportMatch[1];
  if (!lucideImports.includes('Activity')) {
    content = content.replace(
      lucideImportMatch[0],
      `import { ${lucideImports}, Activity } from 'lucide-react';`
    );
  }
}

fs.writeFileSync('src/app/[locale]/dashboard/layout.tsx', content);
