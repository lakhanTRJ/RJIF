CREATE TABLE IF NOT EXISTS highlight_videos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section ENUM('session','event') NOT NULL DEFAULT 'session',
  title VARCHAR(255) NOT NULL,
  cover_image_url VARCHAR(1000) NOT NULL,
  youtube_url VARCHAR(1000) NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_highlight_public (section,is_visible,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exhibition_testimonials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  forum ENUM('india','south') NOT NULL DEFAULT 'india',
  quote TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(1000),
  image_url VARCHAR(1000),
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_testimonial_public (forum,is_visible,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO highlight_videos (section,title,cover_image_url,youtube_url,sort_order)
SELECT 'session','Abhishek Raniwala','/reference/2026/09/Session-Highlight-Abhishek-Raniwala.jpeg','https://www.youtube.com/watch?v=1ssz0OW_8pQ',0
WHERE NOT EXISTS (SELECT 1 FROM highlight_videos);
INSERT INTO highlight_videos (section,title,cover_image_url,youtube_url,sort_order) VALUES
('session','Ishu Datwani','/reference/2026/09/Session-Highlight-Ishu-Datwani.jpeg','https://www.youtube.com/watch?v=aBUvadEXbYE',1),
('session','Riva Dhir','/reference/2026/09/Session-Highlight-Riva-Dhir.jpeg','https://www.youtube.com/watch?v=q4BLmcxXh7s',2),
('event','Forum','/reference/2026/09/Session-Highlight-Shradha-Keshri.jpeg','https://www.youtube.com/watch?v=sCHQfXHAM2o',0),
('event','Awards','/reference/2026/09/Session-Highlight-Shreyansh-Kapoor.jpeg','https://www.youtube.com/watch?v=jtG64WleD4o',1);

INSERT INTO exhibition_testimonials (forum,quote,name,role,image_url,sort_order) VALUES
('india','Retail Jewellers India Forum is the best platform to connect directly with top brands. Our work is being recognized for its global-standard imagery and creative impact.','Kinnari Sanghvi','Jeetu and Kinnari Photography and Films','/reference/2025/08/Kinnari-Sanghvi-Jeetu-and-Kinnari-Photography-and-Films.jpeg',0),
('india','This forum is a powerful platform for industry insights, networking, and driving meaningful change. It is our responsibility to support and grow with such initiatives.','Chetan Kumar Mehta','CMD, Lakshmi Diamonds','/reference/2025/08/chetan-kumar-mehta.jpg',1),
('india','The forum connects us with educated, decision-making jewellers under one roof—making it easier to showcase our product, generate quality leads, and build valuable partnerships.','Karan Jagani','Founder, Jwero.ai','/reference/2025/08/Karan-Jagani-Founder-Jwero.jpg',2),
('india','The forum gives us unmatched brand visibility and direct access to key decision-makers. It fast-tracks our sales and reinforces our presence in the industry.','Rohit Karnik','Iris RFID','/reference/2025/08/Rohit-Karnik-Iris-RFID.jpg',3),
('india','This forum is the best platform to connect directly with retailers. It helped me reconnect with old clients and grow my network under one roof.','Saket Shrikant','Studio 369','/reference/2025/08/Saket-Shrikant-Studio-369.jpeg',4),
('india','Retail Jewelry India fills a critical industry gap. It has helped us connect with the right clients, understand diverse customer needs, and showcase how timely store setup can save costs and boost ROI.','Nilesh Rathod','Founder & CEO, Atmosphere','/reference/2025/08/Nilesh-Rathod-Founder-CEO-Atmosphere.jpg',5);

INSERT INTO exhibition_testimonials (forum,quote,name,role,image_url,sort_order)
SELECT 'south',quote,name,role,image_url,sort_order FROM exhibition_testimonials WHERE forum='india';
