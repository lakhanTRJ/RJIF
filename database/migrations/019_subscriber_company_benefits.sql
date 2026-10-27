CREATE TABLE subscriber_companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO subscriber_companies (name) SELECT DISTINCT TRIM(company) FROM magazine_subscribers;
ALTER TABLE magazine_subscribers
  ADD COLUMN company_id BIGINT UNSIGNED NULL,
  ADD COLUMN mobile2 VARCHAR(20) NULL,
  ADD CONSTRAINT fk_subscriber_company FOREIGN KEY (company_id) REFERENCES subscriber_companies(id);
UPDATE magazine_subscribers s JOIN subscriber_companies c ON c.name=TRIM(s.company) SET s.company_id=c.id;
ALTER TABLE magazine_subscribers MODIFY company_id BIGINT UNSIGNED NOT NULL;

CREATE TABLE subscriber_mobile_contacts (
  mobile VARCHAR(20) PRIMARY KEY,
  subscriber_id BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY (subscriber_id) REFERENCES magazine_subscribers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO subscriber_mobile_contacts SELECT mobile,id FROM magazine_subscribers;

ALTER TABLE award_applications ADD COLUMN event_year SMALLINT UNSIGNED NOT NULL DEFAULT 2027;

CREATE TABLE subscriber_award_benefits (
  company_id BIGINT UNSIGNED NOT NULL,
  event_year SMALLINT UNSIGNED NOT NULL,
  application_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (company_id,event_year),
  FOREIGN KEY (company_id) REFERENCES subscriber_companies(id),
  FOREIGN KEY (application_id) REFERENCES award_applications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preserve history. Prefer an already-paid application when old duplicate claims exist.
INSERT INTO subscriber_award_benefits (company_id,event_year,application_id)
SELECT s.company_id,a.event_year,
  COALESCE(MIN(CASE WHEN a.status='paid' THEN a.id END),MIN(a.id))
FROM award_applications a JOIN magazine_subscribers s ON s.id=a.subscriber_id
GROUP BY s.company_id,a.event_year;
