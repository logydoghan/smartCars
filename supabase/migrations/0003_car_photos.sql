-- A free photo of each car from Wikimedia Commons, with the credit its license requires:
-- { url, width, height, page_url, author, license, license_url }
alter table cars add column if not exists photo jsonb;
