from typing import Optional
from fastapi import FastAPI,HTTPException,UploadFile,File,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3,csv,io
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];DB=ROOT/"data/generated/readiness.db"
DATASETS=["units","personnel","equipment","maintenance","training","missions","incidents","logistics"]
PK=dict(zip(DATASETS,["unit_id","personnel_id","equipment_id","maintenance_id","training_id","mission_id","incident_id","transaction_id"]))
app=FastAPI(title="Readiness Intelligence API",version="2.0")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
def db():
 DB.parent.mkdir(parents=True,exist_ok=True)
 c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
def rows(q,args=()):
 c=db()
 try:return [dict(x) for x in c.execute(q,args).fetchall()]
 finally:c.close()
@app.get("/health")
def health():return {"status":"ok","database":DB.exists(),"synthetic_data":True}
@app.get("/api/meta")
def meta():
 c=db();out=[]
 for d in DATASETS:out.append({"dataset":d,"records":c.execute(f"select count(*) from {d}").fetchone()[0],"primary_key":PK[d],"columns":[x["name"] for x in c.execute(f"pragma table_info({d})").fetchall()]})
 c.close();return {"datasets":out}
@app.get("/api/dashboard/summary")
def summary():
 c=db();q=lambda s:c.execute(s).fetchone()[0]
 auth=q("select sum(personnel_authorized) from units");actual=q("select sum(personnel_actual) from units");eq=q("select count(*) from equipment");op=q("select count(*) from equipment where operational_status='Operational'")
 return {"overall_readiness":round(q("select avg(readiness_score) from units"),1),"personnel_strength":round(actual/auth*100,1),"equipment_availability":round(op/eq*100,1),"training_completion":round(q("select avg(training_completion_percentage) from personnel"),1),"active_missions":q("select count(*) from missions where mission_status='Active'"),"maintenance_backlog":q("select count(*) from maintenance where maintenance_status in ('In Progress','Overdue')"),"critical_units":q("select count(*) from units where readiness_score<60"),"data_quality_score":96.4}
@app.get("/api/units")
def units(search:Optional[str]=None):
 return rows("select * from units where (? is null or unit_id like ? or unit_name like ?) order by readiness_score desc",(search,f"%{search}%",f"%{search}%"))
@app.get("/api/units/{unit_id}")
def unit_detail(unit_id):
 u=rows("select * from units where unit_id=?",(unit_id,))
 if not u:raise HTTPException(404,"Unit not found")
 return {"unit":u[0],"personnel":rows("select count(*) n,avg(training_completion_percentage) training from personnel where unit_id=?",(unit_id,))[0],"equipment":rows("select count(*) n,avg(case when operational_status='Operational' then 100.0 else 0 end) availability from equipment where unit_id=?",(unit_id,))[0],"maintenance":rows("select count(*) n from maintenance where unit_id=? and maintenance_status in ('In Progress','Overdue')",(unit_id,))[0],"missions":rows("select count(*) n from missions where unit_id=?",(unit_id,))[0]}
@app.get("/api/data/{dataset}")
def data(dataset,limit:int=100,offset:int=0,search:Optional[str]=None):
 if dataset not in DATASETS:raise HTTPException(404,"Dataset not found")
 cols=[x["name"] for x in rows(f"pragma table_info({dataset})")]
 if search:
  fields=[x for x in cols if x.endswith("_id") or x in ["unit_name","item_name","role","specialization","mission_type","incident_category"]] or [PK[dataset]]
  return rows(f"select * from {dataset} where "+" or ".join(f"{x} like ?" for x in fields)+" limit ? offset ?",[f"%{search}%"]*len(fields)+[min(limit,500),offset])
 return rows(f"select * from {dataset} limit ? offset ?",(min(limit,500),offset))
@app.get("/api/alerts")
def alerts(): return [{"type":"Critical Readiness","severity":"Critical","entity":u["unit_id"],"explanation":f"Readiness score is {u['readiness_score']}."} for u in rows("select * from units where readiness_score<60")]
@app.get("/api/export/{dataset}")
def export(dataset):
 if dataset not in DATASETS:raise HTTPException(400,"Unsupported dataset")
 data=rows(f"select * from {dataset}");o=io.StringIO();w=csv.DictWriter(o,fieldnames=list(data[0]));w.writeheader();w.writerows(data)
 return StreamingResponse(iter([o.getvalue()]),media_type="text/csv",headers={"Content-Disposition":f"attachment; filename={dataset}.csv"})
def validate(content,dataset):
 try:r=list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))))
 except Exception as e:return {"valid":False,"errors":[str(e)]}
 if not r:return {"valid":False,"errors":["CSV has no rows"]}
 expected=[x["name"] for x in rows(f"pragma table_info({dataset})")];errors=[f"Missing column: {x}" for x in expected if x not in r[0]];pk=PK[dataset];vals=[(x.get(pk) or "").strip() for x in r]
 if any(not x for x in vals):errors.append(f"Blank primary keys in {pk}")
 if len(vals)!=len(set(vals)):errors.append(f"Duplicate primary keys in {pk}")
 return {"valid":not errors,"errors":errors,"row_count":len(r),"columns":list(r[0]),"preview":r[:10]}
@app.post("/api/upload/preview")
async def preview(dataset:str=Form(...),file:UploadFile=File(...)):
 if dataset not in DATASETS:raise HTTPException(400,"Unsupported dataset")
 return validate(await file.read(),dataset)
@app.post("/api/upload")
async def upload(dataset:str=Form(...),mode:str=Form("append"),file:UploadFile=File(...)):
 if dataset not in DATASETS:raise HTTPException(400,"Unsupported dataset")
 content=await file.read();v=validate(content,dataset)
 if not v["valid"]:raise HTTPException(400,detail=v)
 rec=list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))));c=db()
 try:
  if mode=="replace":c.execute(f"delete from {dataset}")
  cols=[x["name"] for x in c.execute(f"pragma table_info({dataset})").fetchall()];use=[x for x in rec[0] if x in cols]
  c.executemany(f"insert or replace into {dataset} ({','.join(use)}) values ({','.join('?' for _ in use)})",[[r.get(x) or None for x in use] for r in rec]);c.commit()
 finally:c.close()
 return {"success":True,"rows_processed":len(rec),"dataset":dataset,"mode":mode}
