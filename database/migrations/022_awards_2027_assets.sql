-- Update only the two requested 2027 assets; keep admin copy, categories,
-- partner settings, event year, prices and every application/payment unchanged.
UPDATE award_settings
SET content=JSON_SET(content,
  '$.introImageUrl','/reference/2026/11/retail-jeweller-excellence-2027-gala.png',
  '$.guidelinesUrl','/reference/2026/11/business-excellence-awards-2027-submission-guidelines.pdf')
WHERE id=1
  AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(content,'$.eventYear')),'2027')='2027';
