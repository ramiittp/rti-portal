-- Seed: Ministries, Departments, Public Authorities
INSERT INTO ministries (name, name_hindi, code, website) VALUES
('Ministry of Education','शिक्षा मंत्रालय','MOE','https://education.gov.in'),
('Ministry of Health and Family Welfare','स्वास्थ्य और परिवार कल्याण मंत्रालय','MOHFW','https://mohfw.gov.in'),
('Ministry of Finance','वित्त मंत्रालय','MOF','https://finmin.nic.in'),
('Ministry of Railways','रेल मंत्रालय','MOR','https://indianrailways.gov.in'),
('Ministry of Home Affairs','गृह मंत्रालय','MHA','https://mha.gov.in');

INSERT INTO departments (ministry_id, name, code) VALUES
((SELECT id FROM ministries WHERE code='MOE'),'Department of Higher Education','DOHE'),
((SELECT id FROM ministries WHERE code='MOE'),'Department of School Education','DSEL'),
((SELECT id FROM ministries WHERE code='MOHFW'),'Department of Health','DHFW'),
((SELECT id FROM ministries WHERE code='MOF'),'Department of Revenue','DOR'),
((SELECT id FROM ministries WHERE code='MOR'),'Railway Board','RB');

INSERT INTO public_authorities (department_id,name,city,state,email,cpio_name,cpio_email,faa_name,faa_email) VALUES
((SELECT id FROM departments WHERE code='DOHE'),'Indian Institute of Technology Tirupati','Tirupati','Andhra Pradesh','cpio@iittp.ac.in','Dr. S. Kumar','cpio@iittp.ac.in','Prof. R. Sharma','faa@iittp.ac.in'),
((SELECT id FROM departments WHERE code='DOHE'),'Indian Institute of Technology Bombay','Mumbai','Maharashtra','cpio@iitb.ac.in','Dr. A. Mehta','cpio@iitb.ac.in','Prof. V. Joshi','faa@iitb.ac.in'),
((SELECT id FROM departments WHERE code='DOHE'),'University Grants Commission','New Delhi','Delhi','cpio@ugc.ac.in','Shri P. Verma','cpio@ugc.ac.in','Smt. K. Singh','faa@ugc.ac.in'),
((SELECT id FROM departments WHERE code='DHFW'),'AIIMS New Delhi','New Delhi','Delhi','cpio@aiims.edu','Dr. M. Gupta','cpio@aiims.edu','Dr. N. Rao','faa@aiims.edu'),
((SELECT id FROM departments WHERE code='DOR'),'Reserve Bank of India','Mumbai','Maharashtra','cpio@rbi.org.in','Shri D. Patel','cpio@rbi.org.in','Shri R. Nair','faa@rbi.org.in');

INSERT INTO rti_templates (title, category, subject, information_sought, description, language) VALUES
('Scholarship Status Enquiry','Education','Information regarding scholarship application status','1. Current status of scholarship application\n2. Amount sanctioned\n3. Date of disbursement\n4. Reasons if rejected','Use this template to seek information about government scholarship applications.',  'en'),
('Tender/Contract Information','Finance','Details of tender/contract awarded','1. Copy of tender document\n2. Names of bidders\n3. Evaluated price bids\n4. Reasons for selection','Use to get information about government tenders and contracts.','en'),
('Public Works Status','Infrastructure','Status of public works/construction project','1. Sanctioned amount\n2. Amount spent so far\n3. Completion percentage\n4. Contractor details','Request status and expenditure of public infrastructure projects.','en'),
('Job Recruitment Details','Employment','Information about government recruitment','1. Number of vacancies\n2. Selection criteria\n3. Result of written exam\n4. Final merit list','Seek transparency in government job recruitment processes.','en');
