-- Insert subcategories for 'Social Media'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Facebook Like & Follow', 
    'YouTube Subscribe', 
    'YouTube Watch Time (1-3 mins)', 
    'Instagram Follow', 
    'TikTok Follow', 
    'Post Share / Repost'
])
FROM task_categories WHERE name = 'Social Media';

-- Insert subcategories for 'Sign-up / Registration'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Simple Sign-up (Email Verify)', 
    'Sign-up + KYC', 
    'Referral Link Sign-up'
])
FROM task_categories WHERE name = 'Sign-up / Registration';

-- Insert subcategories for 'App Download & Review'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Android App Install', 
    'iOS App Install', 
    'App Install + 5 Star Rating', 
    'App Install + Custom Review'
])
FROM task_categories WHERE name = 'App Download & Review';

-- Insert subcategories for 'Website Visit & Search'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Google Search & Click (SEO)', 
    'Website Visit (1-3 Minutes)', 
    'Search + Ad Click'
])
FROM task_categories WHERE name = 'Website Visit & Search';

-- Insert subcategories for 'Join Community'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Telegram Channel/Group Join', 
    'Discord Server Join', 
    'WhatsApp Group Join', 
    'Facebook Group Join'
])
FROM task_categories WHERE name = 'Join Community';

-- Insert subcategories for 'Write Comment'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'YouTube Custom Comment', 
    'Facebook Post Comment', 
    'Trustpilot / App Store Review', 
    'Blog / Website Comment'
])
FROM task_categories WHERE name = 'Write Comment';

-- Insert subcategories for 'Others'
INSERT INTO task_subcategories (category_id, name)
SELECT id, unnest(ARRAY[
    'Data Entry / Collection', 
    'Custom Task'
])
FROM task_categories WHERE name = 'Others';
