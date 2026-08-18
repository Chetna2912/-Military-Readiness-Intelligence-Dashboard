SELECT AVG(readiness_score) overall_readiness FROM units;
SELECT unit_id,unit_name,readiness_score FROM units ORDER BY readiness_score DESC;
SELECT unit_id,AVG(CASE WHEN operational_status='Operational' THEN 100.0 ELSE 0 END) equipment_availability FROM equipment GROUP BY unit_id;
SELECT unit_id,AVG(training_completion_percentage) training_completion FROM personnel GROUP BY unit_id;
SELECT unit_id,COUNT(*) maintenance_backlog FROM maintenance WHERE maintenance_status IN ('In Progress','Overdue') GROUP BY unit_id;
