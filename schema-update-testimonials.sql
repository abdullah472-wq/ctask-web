-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_role TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data
INSERT INTO testimonials (user_name, user_role, rating, review_text, is_visible)
VALUES 
    ('Sarah Jenkins', 'Client', 5, 'This platform has completely transformed how I get my tasks done. The freelancers are top-notch and always deliver on time.', true),
    ('David Chen', 'Worker', 5, 'I have been able to find consistent work and the payment process is seamless. Highly recommend this for freelancers.', true),
    ('Emily Rodriguez', 'Client', 4, 'Great experience overall. The interface is intuitive and it is easy to communicate with workers.', true);
