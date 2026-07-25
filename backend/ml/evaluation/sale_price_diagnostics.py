"""Reproducible diagnostics for the current sale-price artifact."""
from pathlib import Path
import json
import joblib
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.database.session import SessionLocal
from ml.config import ARTIFACTS_DIR, DEFAULT_SEED
from ml.feature_definitions import PRICE_BOOLEAN, PRICE_CATEGORICAL, PRICE_FEATURE_FLAGS, PRICE_NUMERIC
from ml.training.train_price_estimator import load_price_data

OUT=Path(__file__).resolve().parents[1]/'metadata'

def metrics(y,p):
    return {'mae':float(mean_absolute_error(y,p)),'rmse':float(mean_squared_error(y,p)**0.5),'r2':float(r2_score(y,p))}

db=SessionLocal()
try: df=load_price_data(db)
finally: db.close()
sale=df[df.listing_type=='sale'].copy()
features=PRICE_CATEGORICAL+PRICE_NUMERIC+PRICE_BOOLEAN+[f'feat_{x}' for x in PRICE_FEATURE_FLAGS]
X=sale[features].copy(); y=sale.price.to_numpy()
Xtr,Xv,ytr,yv=train_test_split(X,y,test_size=.2,random_state=DEFAULT_SEED)
mean_pred=np.full_like(yv,float(np.mean(ytr)),dtype=float)
median_pred=np.full_like(yv,float(np.median(ytr)),dtype=float)
ppm=np.median(ytr/np.maximum(Xtr.area_sqm.to_numpy(dtype=float),1))
sqm_pred=ppm*np.maximum(Xv.area_sqm.to_numpy(dtype=float),1)
bundle=joblib.load(ARTIFACTS_DIR/'price_estimator_sale.joblib'); model=bundle['model']; pred=model.predict(Xv)
residual=yv-pred
sale['price_per_sqm']=sale.price/sale.area_sqm.clip(lower=1)
q=sale.price.quantile([0,.01,.05,.25,.5,.75,.95,.99,1]).to_dict()
errors=[]
val=sale.loc[Xv.index,['city','district','property_type','price','area_sqm']].copy(); val['prediction']=pred; val['absolute_error']=abs(residual)
for _,r in val.nlargest(10,'absolute_error').iterrows():
    errors.append({'city':r.city,'district':r.district,'property_type':r.property_type,'area_sqm':float(r.area_sqm),'actual_price':float(r.price),'predicted_price':float(r.prediction),'absolute_error':float(r.absolute_error)})
report={
 'eligible_records':len(sale),'training_records':len(Xtr),'validation_records':len(Xv),'seed':DEFAULT_SEED,
 'price_summary':{'minimum':float(sale.price.min()),'maximum':float(sale.price.max()),'mean':float(sale.price.mean()),'median':float(sale.price.median()),'standard_deviation':float(sale.price.std()),'percentiles':{str(k):float(v) for k,v in q.items()}},
 'missing_or_unknown':{c:int((sale[c].isna() | (sale[c].astype(str)=='Unknown') | (sale[c].astype(str)=='0')).sum()) for c in PRICE_CATEGORICAL+PRICE_NUMERIC},
 'exact_duplicate_feature_target_rows':int(sale.duplicated(subset=features+['price']).sum()),
 'property_type_distribution':sale.property_type.value_counts().to_dict(),'regional_distribution':sale.city.value_counts().head(20).to_dict(),
 'price_per_sqm_summary':{k:float(v) for k,v in sale.price_per_sqm.describe(percentiles=[.01,.05,.5,.95,.99]).to_dict().items()},
 'suspected_price_outliers_above_99th_percentile':int((sale.price>sale.price.quantile(.99)).sum()),
 'baselines':{'training_mean':metrics(yv,mean_pred),'training_median':metrics(yv,median_pred),'median_price_per_sqm':metrics(yv,sqm_pred)},
 'official_random_forest':metrics(yv,pred),'residual_summary':{k:float(v) for k,v in {'mean':residual.mean(),'median':np.median(residual),'std':residual.std(),'p05':np.quantile(residual,.05),'p95':np.quantile(residual,.95)}.items()},
 'largest_anonymized_errors':errors,
 'interpretation':'The target is extremely right-skewed and contains high-value outliers. The negative validation R-squared means the selected artifact does not outperform a constant-mean reference on this split. It remains experimental and is not approved for production.'}
(OUT/'sale_price_diagnostics.json').write_text(json.dumps(report,indent=2,default=str),encoding='utf8')
md=['# Sale-price diagnostic report','',f"Eligible records: {len(sale)}; training: {len(Xtr)}; validation: {len(Xv)}; seed: {DEFAULT_SEED}.",'',
'## Target distribution','',f"Minimum: {sale.price.min():,.2f} TND; maximum: {sale.price.max():,.2f} TND; median: {sale.price.median():,.2f} TND; mean: {sale.price.mean():,.2f} TND; standard deviation: {sale.price.std():,.2f} TND.",'',
'## Validation comparison','', '| Method | MAE | RMSE | R-squared |','|---|---:|---:|---:|']
for name,m in {**report['baselines'],'official_random_forest':report['official_random_forest']}.items(): md.append(f"| {name} | {m['mae']:,.2f} | {m['rmse']:,.2f} | {m['r2']:.6f} |")
md += ['', 'The official negative R-squared is retained. The highly skewed target and extreme upper-tail prices dominate squared error; current production readiness remains **not approved**. Full distributions, missing-value proxies, duplicates, regional/property-type counts, price-per-square-meter statistics, residuals, and anonymized largest errors are stored in `sale_price_diagnostics.json`.']
(OUT/'sale_price_diagnostics.md').write_text('\n'.join(md),encoding='utf8')
print('\n'.join(md))
