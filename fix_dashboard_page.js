const fs = require('fs');
let data = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

data = data.replace(
  `import { useLanguage } from '@/contexts/LanguageContext';`,
  `import { useLanguage } from '@/contexts/LanguageContext';\nimport { useTranslations } from 'next-intl';`
);

data = data.replace(
  `const { t } = useLanguage();`,
  `const t = useTranslations('Dashboard');\n  const { language, setLanguage } = useLanguage();`
);

fs.writeFileSync('src/app/dashboard/page.tsx', data);
