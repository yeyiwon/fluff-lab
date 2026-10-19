import React from 'react';
export function WebGlass({children,className='',...props}:React.HTMLAttributes<HTMLDivElement>){
 return <div {...props} className={`glass-surface ${className}`}><div className="glass-reflection" aria-hidden="true"/>{children}</div>;
}
