from fastapi.testclient import TestClient
from backend.app.main import app
client=TestClient(app)
def test_health(): assert client.get('/health').status_code==200
def test_summary(): assert 0<=client.get('/api/dashboard/summary').json()['overall_readiness']<=100
def test_units(): assert client.get('/api/units').status_code==200
def test_meta(): assert len(client.get('/api/meta').json()['datasets'])==8
def test_upload_preview():
 s='unit_id,unit_name,unit_type,region,base_location,commanding_structure,personnel_authorized,personnel_actual,readiness_score,operational_status\nTST-001,Test,Test,Test,Test,Test,1,1,90,Operational\n'
 r=client.post('/api/upload/preview',data={'dataset':'units'},files={'file':('test.csv',s,'text/csv')});assert r.status_code==200 and r.json()['valid']
