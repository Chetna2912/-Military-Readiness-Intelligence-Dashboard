import sqlite3
from pathlib import Path
def test_database():
 p=Path(__file__).resolve().parents[1]/'data/generated/readiness.db';c=sqlite3.connect(p);assert c.execute('select count(*) from units').fetchone()[0]==60;c.close()
