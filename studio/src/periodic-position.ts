// Display placement only; no second element-identity or periodic-group catalogue.
export function periodicPosition(e: {z:number;period:number;group:number|null}): [number,number] | null {
  if(e.z>=57 && e.z<=71)return [9,e.z-54];
  if(e.z>=89 && e.z<=103)return [10,e.z-86];
  return e.group===null?null:[e.period,e.group];
}
