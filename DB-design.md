Komik Management - Draft

Language
- id 
- ISO-2

Websites (sumber resource untuk scraping):
- id
- name
- url
- lang
- use browser (untuk menentukan menggunakan puppeteer atau tidak)
- search comics (endpoint url, ex: "/comics?search={query}", "{query}" akan diganti dengan kata kunci pencarian)

Komik
- id
- title
- synopsis

Komik From Website (1 komik <-> many websites)
- id
- komik_id
- website_id
- url
- total_chapters

Chapters (1 komik <-> many chapters) - TODO Later, 1 komik, 1 website, but many chapters
