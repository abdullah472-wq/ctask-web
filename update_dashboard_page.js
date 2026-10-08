const fs = require('fs');
let data = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

if (!data.includes(`import { useLanguage } from '@/contexts/LanguageContext';`)) {
  data = data.replace(
    `import { supabase } from '@/utils/supabase';`,
    `import { supabase } from '@/utils/supabase';\nimport { useLanguage } from '@/contexts/LanguageContext';`
  );
}

if (!data.includes(`const { t } = useLanguage();`)) {
  data = data.replace(
    `const [loading, setLoading] = useState(true);`,
    `const { t } = useLanguage();\n  const [loading, setLoading] = useState(true);`
  );
}

data = data.replace(/>Total Earned</g, `>{t('totalEarned')}<`);
data = data.replace(/>Completed Tasks</g, `>{t('completedTasks')}<`);
data = data.replace(/>Identity Verification</g, `>{t('identityVerification')}<`);

fs.writeFileSync('src/app/dashboard/page.tsx', data);
