import{r as e}from"./rolldown-runtime-hePW80VL.js";import{A as t,H as n,t as r}from"./Box-CkxmMsFY.js";import{M as i,Z as a,a as o}from"./service-DWszkjtD.js";import{t as s}from"./DatasetDataGrid-BznB7TlL.js";import{u as c}from"./index-e39nuUq7.js";var l=e(n(),1),u=`Library services supply these figures annually to [Arts Council England](https://www.artscouncil.org.uk/supporting-arts-museums-and-libraries/supporting-libraries). Returns can include errors, gaps, or changes in how activity was recorded. An unusual figure can also reflect local events, such as temporary building closures or system upgrades.

## Status labels

* **Worth checking:** The figure looks unusual or does not match other parts of the return. It remains as reported.
* **Corrected:** A clear error was identified and a replacement value is provided. The note records both values and the reason for the change.
* **Excluded:** The reported figure cannot be used reliably and is excluded from totals.
* **Spread across months:** A quarterly or annual total has been divided evenly across the months.

A note on one figure does not mean other measures from that service are affected.

## How measures are defined

* **Active users:** Library members who borrowed or renewed at least one item during the financial year.
* **Loans:** Items borrowed or renewed. Age categories reflect the intended audience of the item, not the age of the borrower.
* **Events and attendance:** Scheduled activities held, and the number of people who attended them.
* **Visits and outreach:** People entering library buildings, plus mobile library and home-delivery interactions.
* **Computers and Wi-Fi:** Hours logged on library computers, and Wi-Fi connection sessions.
* **Financial year:** Runs from 1 April to 31 March.
`,d=t(),f=()=>{let[{serviceRecords:e},t]=i();return(0,l.useEffect)(()=>{(!e||e.length===0)&&o().then(e=>{t({type:`AddServices`,serviceRecords:e})})},[e,t]),(0,d.jsxs)(r,{sx:{my:3},children:[(0,d.jsx)(a,{component:`h2`,variant:`h5`,sx:{mb:1},children:`Data quality`}),(0,d.jsx)(a,{variant:`body2`,sx:{mb:2},children:`Figures marked Worth checking remain as reported. Corrections and exclusions are recorded separately.`}),(0,d.jsxs)(r,{component:`details`,sx:{mb:3},children:[(0,d.jsx)(r,{component:`summary`,sx:{cursor:`pointer`,fontWeight:600},children:`What these figures mean`}),(0,d.jsx)(c,{children:u})]}),(0,d.jsx)(s,{datasetId:`errors`,height:620})]})};export{f as default};