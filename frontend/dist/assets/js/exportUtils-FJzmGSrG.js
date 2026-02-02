import{e as q}from"./exceljs.min-CDOiJnxK.js";import{h as B,E as W}from"./html2canvas.esm-DPhe92V5.js";import{I as $}from"./antd-vendor-DAor0KTu.js";import"./react-vendor-DTT0EbPP.js";import"./index-CykRupfb.js";import"./utils-vendor-BsYhjA75.js";const Q=async t=>{try{const{filename:a,title:b,columns:l,data:x,selectedRowKeys:c}=t,h=c&&c.length>0?x.filter(o=>c.includes(o.id)):x;if(!h||h.length===0){$.warning("내보낼 데이터가 없습니다.");return}const i=new q.Workbook,n=i.addWorksheet(b||"Sheet1"),u=l.map(o=>o.title);n.addRow(u),n.getRow(1).eachCell(o=>{o.font={bold:!0,color:{argb:"FFFFFF"}},o.fill={type:"pattern",pattern:"solid",fgColor:{argb:"366092"}},o.alignment={horizontal:"center",vertical:"middle"},o.border={top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"}}}),h.forEach(o=>{const m=l.map(s=>{try{if(s.render&&typeof s.render=="function"){const w=s.render(o[s.dataIndex||s.key],o);return String(w||"").replace(/원$/,"")}const r=(s.dataIndex||s.key).split(".");let I=o;for(const w of r)I=I?.[w];return I||""}catch{return""}});n.addRow(m)}),n.columns.forEach((o,m)=>{o&&(o.width=Math.max(u[m]?.length||10,...h.map(s=>String(n.getCell(s+2,m+1).value||"").length))+2)}),n.eachRow((o,m)=>{m>1&&o.eachCell(s=>{s.border={top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"}},s.alignment={horizontal:"center",vertical:"middle"}})});const L=await i.xlsx.writeBuffer(),g=new Blob([L],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),p=window.URL.createObjectURL(g),y=document.createElement("a");y.href=p,y.download=`${a}_${new Date().toISOString().slice(0,10)}.xlsx`,document.body.appendChild(y),y.click(),document.body.removeChild(y),window.URL.revokeObjectURL(p),$.success("엑셀 파일이 다운로드되었습니다.")}catch(a){$.error(`엑셀 내보내기에 실패했습니다: ${a instanceof Error?a.message:"알 수 없는 오류"}`)}},Z=async t=>{try{const{filename:a,title:b,columns:l,data:x,selectedRowKeys:c,companyInfo:h}=t,i=c&&c.length>0?x.filter(k=>c.includes(k.id)):x;if(!i||i.length===0){$.warning("내보낼 데이터가 없습니다.");return}const n=document.createElement("div");n.style.position="absolute",n.style.left="-9999px",n.style.top="-9999px",n.style.width="1200px",n.style.backgroundColor="white",n.style.padding="20px",n.style.fontFamily='"Malgun Gothic", "맑은 고딕", Arial, sans-serif',n.style.fontSize="12px";const u=new Date().toLocaleDateString("ko-KR"),v=l.map(k=>`<th style="border: 1px solid #333; padding: 8px; background-color: #f5f5f5; font-weight: bold; text-align: center; font-size: 12px;">${k.title}</th>`).join(""),L=i.map(k=>`<tr>${l.map(f=>{let S="";try{if(f.render&&typeof f.render=="function")S=f.render(k[f.dataIndex||f.key],k);else{const A=(f.dataIndex||f.key).split(".");let D=k;for(const z of A)D=D?.[z];S=String(D||"")}}catch{S=""}return`<td style="border: 1px solid #333; padding: 6px; text-align: center; font-size: 11px;">${S}</td>`}).join("")}</tr>`).join(""),g=h||{name:"가온에프에스유한회사",businessNumber:"818-87-01513",phone:"031-527-3564",email:"business@gaonfscorp.com"};n.innerHTML=`
      <div style="margin-bottom: 20px;">
        <h1 style="text-align: center; margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: #333;">${b||"문서 출력"}</h1>
        <div style="text-align: right; font-size: 11px; color: #666; margin-bottom: 15px;">출력일자: ${u} ${new Date().toLocaleTimeString("ko-KR")}</div>
        <div style="font-size: 11px; margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
          <strong>회사명:</strong> ${g.name||"-"} |
          <strong>사업자번호:</strong> ${g.businessNumber||"-"} |
          <strong>연락처:</strong> ${g.phone||"-"} |
          <strong>이메일:</strong> ${g.email||"-"}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #333; background: white;">
        <thead><tr>${v}</tr></thead>
        <tbody>${L}</tbody>
      </table>
      <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; text-align: center;">
        <p>본 문서는 ERP 시스템에서 자동 생성된 문서입니다. (총 ${i.length}건)</p>
      </div>
    `,document.body.appendChild(n);const p=await B(n,{useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",width:1200,height:n.scrollHeight});document.body.removeChild(n);const y=p.toDataURL("image/jpeg",.8),o=new W("l","mm","a4"),m=o.internal.pageSize.getWidth(),s=o.internal.pageSize.getHeight(),r=p.width,I=p.height,w=Math.min((m-20)/r,(s-20)/I),M=(m-r*w)/2;o.addImage(y,"JPEG",M,10,r*w,I*w);const P=`${a}_${new Date().toISOString().slice(0,10)}.pdf`;o.save(P),$.success("PDF 파일이 다운로드되었습니다.")}catch(a){$.error(`PDF 내보내기에 실패했습니다: ${a instanceof Error?a.message:"알 수 없는 오류"}`)}},it=()=>({purchase:[{key:"purchaseDate",title:"매입일자",dataIndex:"purchaseDate"},{key:"company",title:"거래처",dataIndex:"company.name"},{key:"totalAmount",title:"총금액",dataIndex:"totalAmount",render:t=>`${t.toLocaleString()}원`},{key:"vatAmount",title:"부가세",dataIndex:"vatAmount",render:t=>`${t.toLocaleString()}원`},{key:"status",title:"상태",dataIndex:"status",render:t=>({pending:"대기",completed:"완료",cancelled:"취소"})[t]||t},{key:"memo",title:"메모",dataIndex:"memo"}],sales:[{key:"saleDate",title:"매출일자",dataIndex:"saleDate"},{key:"company",title:"거래처",dataIndex:"company.name"},{key:"totalAmount",title:"총금액",dataIndex:"totalAmount",render:t=>`${t.toLocaleString()}원`},{key:"vatAmount",title:"부가세",dataIndex:"vatAmount",render:t=>`${t.toLocaleString()}원`},{key:"status",title:"상태",dataIndex:"status",render:t=>({pending:"대기",completed:"완료",cancelled:"취소"})[t]||t},{key:"memo",title:"메모",dataIndex:"memo"}],payment:[{key:"paymentDate",title:"일자",dataIndex:"paymentDate"},{key:"company",title:"거래처",dataIndex:"company.name"},{key:"type",title:"유형",dataIndex:"type",render:t=>t==="receipt"?"수금":"지급"},{key:"amount",title:"금액",dataIndex:"amount",render:t=>`${t.toLocaleString()}원`},{key:"method",title:"방법",dataIndex:"method",render:t=>({cash:"현금",bank_transfer:"계좌이체",check:"수표",card:"카드"})[t]||t},{key:"memo",title:"메모",dataIndex:"memo"}],ledger:[{key:"date",title:"일자",dataIndex:"date"},{key:"company",title:"거래처",dataIndex:"company.name"},{key:"description",title:"내용",dataIndex:"description"},{key:"debitAmount",title:"차변",dataIndex:"debitAmount",render:t=>t>0?`${t.toLocaleString()}원`:"-"},{key:"creditAmount",title:"대변",dataIndex:"creditAmount",render:t=>t>0?`${t.toLocaleString()}원`:"-"},{key:"runningBalance",title:"잔액",dataIndex:"runningBalance",render:t=>`${(t||0).toLocaleString()}원`},{key:"type",title:"유형",dataIndex:"type",render:t=>({purchase:"매입",sales:"매출",receipt:"수금",payment:"지급"})[t]||t}],customer:[{key:"customerCode",title:"거래처코드",dataIndex:"customerCode"},{key:"name",title:"거래처명",dataIndex:"name"},{key:"businessNumber",title:"사업자번호",dataIndex:"businessNumber"},{key:"representative",title:"대표자",dataIndex:"representative"},{key:"phone",title:"연락처",dataIndex:"phone"},{key:"email",title:"이메일",dataIndex:"email"},{key:"customerType",title:"유형",dataIndex:"customerType",render:t=>({customer:"고객",supplier:"공급업체",both:"고객+공급업체"})[t]||t},{key:"memo",title:"비고",dataIndex:"memo"}],product:[{key:"productCode",title:"품목코드",dataIndex:"productCode"},{key:"name",title:"품목명",dataIndex:"name"},{key:"spec",title:"규격",dataIndex:"spec"},{key:"unit",title:"단위",dataIndex:"unit"},{key:"buyPrice",title:"매입단가",dataIndex:"buyPrice",render:t=>t?`${t.toLocaleString()}원`:"-"},{key:"sellPrice",title:"매출단가",dataIndex:"sellPrice",render:t=>t?`${t.toLocaleString()}원`:"-"},{key:"category",title:"분류",dataIndex:"category"},{key:"taxType",title:"세금구분",dataIndex:"taxType",render:t=>({tax_separate:"별도과세",tax_inclusive:"부가세포함",tax_free:"면세"})[t]||t},{key:"memo",title:"비고",dataIndex:"memo"}]}),rt=(t,a,b,l,x)=>{if(typeof t=="function"){const n=t;return[{key:"excel",label:"엑셀로 내보내기",onClick:()=>n("excel")},{key:"pdf",label:"PDF로 내보내기",onClick:()=>n("pdf")}]}const c=t,i=(a||[]).filter(n=>{const u=(n.key||n.dataIndex||"").toLowerCase();return!["action","actions","작업"].includes(u)}).map(n=>({key:n.key||n.dataIndex||"",title:n.title||"",dataIndex:n.dataIndex||n.key||"",render:n.render?(u,v)=>{try{const g=n.dataIndex&&n.dataIndex!==n.key?n.render(u,v):n.render(v,v);if(g&&typeof g=="object"){if(g.props){const p=g.props.children;return typeof p=="string"?p:typeof p=="number"?String(p):Array.isArray(p)?p.filter(y=>typeof y=="string"||typeof y=="number").join(""):""}return""}return String(g??"")}catch{return String(u??"")}}:void 0}));return[{key:"excel",label:"엑셀로 내보내기",onClick:()=>{Q({filename:b||"export",title:b||"데이터 목록",columns:i,data:c,companyInfo:x})}},{key:"pdf",label:"PDF로 내보내기",onClick:()=>{Z({filename:b||"export",title:b||"데이터 목록",columns:i,data:c,companyInfo:x})}}]},lt=async t=>{try{const{filename:a,title:b,customer:l,dateRange:x,previousBalance:c,entries:h,ledgerEntries:i}=t;if(!h||h.length===0){$.warning("내보낼 데이터가 없습니다.");return}const n=i.filter(e=>e.type==="sales").reduce((e,d)=>e+(d.supplyAmount||0),0),u=i.filter(e=>e.type==="sales").reduce((e,d)=>e+(d.vatAmount||0),0),v=i.filter(e=>e.type==="sales").reduce((e,d)=>e+(d.totalAmount||0),0),L=i.filter(e=>e.type==="purchase").reduce((e,d)=>e+(d.supplyAmount||0),0),g=i.filter(e=>e.type==="purchase").reduce((e,d)=>e+(d.vatAmount||0),0),p=i.filter(e=>e.type==="purchase").reduce((e,d)=>e+(d.totalAmount||0),0),y=i.filter(e=>e.type==="receipt").reduce((e,d)=>e+(d.totalAmount||0),0),o=i.filter(e=>e.type==="payment").reduce((e,d)=>e+(d.totalAmount||0),0),m=i.length>0?i[i.length-1].balance:0,s=e=>e?e.replace(/(\d{3})(\d{2})(\d{5})/,"$1-$2-$3"):"미등록",r=document.createElement("div");r.style.position="absolute",r.style.left="-9999px",r.style.top="-9999px",r.style.width="1100px",r.style.backgroundColor="white",r.style.padding="20px",r.style.fontFamily='"Malgun Gothic", "맑은 고딕", Arial, sans-serif';const I=c!==0?`
      <tr style="background-color: #fffbe6;">
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${x.start}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${l.name}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; color: #faad14;">이월</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">전잔금</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: ${c>=0?"#1890ff":"#ff4d4f"};">${c.toLocaleString()}원</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
      </tr>
    `:"",w=h.filter(e=>!e.isCarryOver).map(e=>{const{isFirstRow:d,currentItemInfo:R,cumulativeBalance:_}=e;let E="";e.type==="receipt"||e.type==="payment"?E=e.description||"":R?E=R.itemName||"":E=e.description||"";const F=R?.amount??(d?e.supplyAmount:null),U=F!=null?`<span style="color: ${F<0?"#ff4d4f":e.type==="sales"?"#1890ff":"#000"}">${F.toLocaleString()}원</span>`:"",T=R?.taxAmount??(d?e.vatAmount:null),V=T!=null?`<span style="color: ${T<0?"#ff4d4f":"#000"}">${T.toLocaleString()}원</span>`:"",H=R?.totalAmount??(d?e.totalAmount:null),K=H!=null?`<span style="color: ${H<0?"#ff4d4f":"#000"}; font-weight: bold;">${H.toLocaleString()}원</span>`:"",J={sales:"#1890ff",purchase:"#000",receipt:"#52c41a",payment:"#fa8c16"},Y={sales:"매출",purchase:"매입",receipt:"수금",payment:"지급"},X=e.date?e.date.substring(0,10):"";return`
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${d?X:""}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${d?e.customerName||l.name:""}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; color: ${J[e.type]||"#000"};">${d&&Y[e.type]||""}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${E}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${U}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${V}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${K}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: ${(_??0)>=0?"#1890ff":"#ff4d4f"};">${(_??0).toLocaleString()}원</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 9px;">${d?e.memo||"-":""}</td>
        </tr>
      `}).join("");r.innerHTML=`
      <div style="font-family: 'Malgun Gothic', sans-serif; font-size: 10pt; line-height: 1.4; color: #000;">
        <!-- 제목 -->
        <div style="font-size: 22pt; font-weight: bold; text-align: left; margin-bottom: 20px;">
          ${b}
        </div>

        <!-- 거래처 정보 -->
        <div style="background-color: #f8f9fa; padding: 12px; margin-bottom: 15px; border: 1px solid #dee2e6; font-size: 10pt;">
          <div style="display: flex; margin-bottom: 6px;">
            <div style="flex: 1;"><strong>거래처명:</strong> ${l.name}</div>
            <div style="flex: 1;"><strong>거래처코드:</strong> ${l.customerCode}</div>
            <div style="flex: 1;"><strong>사업자번호:</strong> ${s(l.businessNumber)}</div>
            <div style="flex: 1;"><strong>대표자:</strong> ${l.representative||"미등록"}</div>
          </div>
          <div style="display: flex;">
            <div style="flex: 1.5;"><strong>주소:</strong> ${l.address||"미등록"}</div>
            <div style="flex: 1;"><strong>전화번호:</strong> ${l.phone||"미등록"}</div>
            <div style="flex: 1;"><strong>이메일:</strong> ${l.email||"미등록"}</div>
            <div style="flex: 1;"><strong>조회기간:</strong> ${x.start} ~ ${x.end}</div>
          </div>
        </div>

        <!-- 거래 내역 테이블 -->
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #000;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 85px;">일자</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 80px;">거래처</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 50px;">구분</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">품목명</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">공급가액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 70px;">세액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">합계</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">잔액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 60px;">비고</th>
            </tr>
          </thead>
          <tbody>
            ${I}
            ${w}

            <!-- 합계 행 -->
            <tr style="background-color: #fafafa; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: ${m>=0?"#1890ff":"#ff4d4f"};">${m.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
            </tr>

            <!-- 매출 합계 / 수금 합계 -->
            <tr style="background-color: #f0f0f0;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">매출 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${n.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${u.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${v.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">수금 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #ff4d4f; font-weight: bold;">${y.toLocaleString()}원</td>
            </tr>

            <!-- 매입 합계 / 지급 합계 -->
            <tr style="background-color: #f0f0f0;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">매입 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${L.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${g.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${p.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">지급 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${o.toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,document.body.appendChild(r);const M=await B(r,{useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",scale:2,width:1100,height:r.scrollHeight});document.body.removeChild(r);const C=new W("l","mm","a4"),P=C.internal.pageSize.getWidth(),k=C.internal.pageSize.getHeight(),j=M.toDataURL("image/jpeg",.95),f=M.width,S=M.height,A=Math.min((P-20)/f,(k-20)/S),D=(P-f*A)/2,z=10,N=S*A,O=k-20;N<=O,C.addImage(j,"JPEG",D,z,f*A,N);const G=`${a}_${new Date().toISOString().slice(0,10)}.pdf`;C.save(G),$.success("거래원장 PDF가 다운로드되었습니다.")}catch(a){$.error(`PDF 내보내기에 실패했습니다: ${a instanceof Error?a.message:"알 수 없는 오류"}`)}};export{rt as createExportMenuItems,Q as exportToExcel,Z as exportToPDF,lt as exportTransactionLedgerToPDF,it as getCommonColumns};
