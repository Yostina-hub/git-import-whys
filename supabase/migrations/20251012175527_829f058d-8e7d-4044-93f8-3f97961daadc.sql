-- Delete sample patients created for testing (MRN000101 through MRN001200)
DELETE FROM patients WHERE mrn >= 'MRN000101' AND mrn <= 'MRN001200';