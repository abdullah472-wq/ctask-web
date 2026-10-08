const fs = require('fs');
let data = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const regex = /<div.*?>\s*<label.*?>\s*<User.*?\/> Choose Avatar\s*<\/label>\s*<div.*?>\s*\{AVATARS\.map\(avatar => \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>/;

data = data.replace(regex, '');

fs.writeFileSync('src/app/dashboard/settings/page.tsx', data);
