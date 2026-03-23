/**
 * Default resume templates (2 DOCX + 2 XLSX).
 * Binary DOCX/XLSX builders — schemas in templateSchemas.js; ids in templateList.js.
 */
import ExcelJS from 'exceljs';
import PizZip from 'pizzip';
import { TEMPLATE_IDS } from './templateList.js';

// ── Table cell border (single line) ──
const tcBorder = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0"/><w:left w:val="single" w:sz="4" w:space="0"/><w:bottom w:val="single" w:sz="4" w:space="0"/><w:right w:val="single" w:sz="4" w:space="0"/></w:tcBorders>';
const tc = (content, widthDxa, merge) => {
  const pr = `<w:tcPr><w:tcW w:w="${widthDxa}" w:type="dxa"/>${tcBorder}${merge || ''}</w:tcPr>`;
  return `<w:tc>${pr}<w:p><w:r><w:t xml:space="preserve">${(content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p></w:tc>`;
};

// ── Build DOCX (JIS 履歴書 style): table with 日付, 氏名, 写真 box, 学歴・職歴 table ──
function buildRirekishoDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t>履歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders><w:tblLook w:val="00A0"/></w:tblPr>
      <w:tr><w:trPr><w:tblHeader/></w:trPr>${tc('日付', 1200)}${tc('　　　年　　　月　　　日', 2400)}${tc('写真', 1200, '<w:vMerge w:val="restart"/>')}</w:tr>
      <w:tr>${tc('氏名', 1200)}${tc('{name}', 2400)}${tc('__PHOTO__', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('ふりがな', 1200)}${tc('{furigana}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('生年月日', 1200)}${tc('{birthdate}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('性別', 1200)}${tc('{gender}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1200)}${tc('{current_address}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1200)}${tc('{phone}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('メールアドレス', 1200)}${tc('{email}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800" w:type="dxa"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('志望動機', 1200)}${tc('{motivation}', 3600)}</w:tr>
      <w:tr>${tc('特技・自己PR', 1200)}${tc('{self_pr}', 3600)}</w:tr>
      <w:tr>${tc('本人希望', 1200)}${tc('{preferences}', 3600)}</w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return buildMinimalDocx(docXml);
}

// ── 履歴書 Photo style ──
function buildRirekishoPhotoDocx() {
  const photoCell = `<w:tc><w:tcPr><w:tcW w:w="1400" w:type="dxa"/>${tcBorder}<w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>__PHOTO__</w:t></w:r></w:p></w:tc>`;
  const photoMerge = `<w:tc><w:tcPr><w:tcW w:w="1400"/>${tcBorder}<w:vMerge/></w:tcPr><w:p/></w:tc>`;
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>履歴書</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2400"/>${tcBorder}</w:tcPr><w:p/><w:p><w:r><w:t>　　　年　　　月　　　日現在</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('ふりがな', 800)}${tc('{furigana}', 2200)}${photoCell}</w:tr>
      <w:tr>${tc('氏名', 800)}${tc('{name}', 2200)}${photoMerge}</w:tr>
      <w:tr>${tc('生年月日', 800)}${tc('{birthdate}', 1200)}${tc('（{age}）', 800)}${photoMerge}</w:tr>
      <w:tr>${tc('性別', 800)}${tc('{gender}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('国籍', 800)}${tc('{nationality}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('現住所', 800)}${tc('{current_address}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('電話', 800)}${tc('{phone}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('E-mail', 800)}${tc('{email}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('連絡先', 800)}${tc('{contact_address}', 2000)}${photoMerge}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴（各別にまとめて書く）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>志望の動機、特技、好きな学科、アピールポイントなど</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{motivation}</w:t></w:r></w:p><w:p><w:r><w:t>{self_pr}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>本人希望記入欄</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{preferences}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

// ── 履歴書 Full: same structure as Photo but simpler photo cell (no long instructions) ──
function buildRirekishoFullDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>履歴書</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>　　　年　　　月　　　日現在</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('ふりがな', 1000)}${tc('{furigana}', 2200)}${tc('写真', 1200, '<w:vMerge w:val="restart"/>')}</w:tr>
      <w:tr>${tc('氏名', 1000)}${tc('{name}', 2200)}${tc('__PHOTO__', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('生年月日', 1000)}${tc('{birthdate}', 1400)}${tc('（{age}）', 800)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('性別', 1000)}${tc('{gender}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('国籍', 1000)}${tc('{nationality}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1000)}${tc('{current_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1000)}${tc('{phone}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('E-mail', 1000)}${tc('{email}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('連絡先', 1000)}${tc('{contact_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('志望の動機・特技・アピール', 1200)}${tc('{motivation}', 3600)}</w:tr>
      <w:tr>${tc('本人希望記入欄', 1200)}${tc('{preferences}', 3600)}</w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

// ── 職務経歴書 DOCX: table header + section tables ──
function buildShokumuDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>職務経歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('氏名', 1400)}${tc('{name}', 3600)}</w:tr>
      <w:tr>${tc('メールアドレス', 1400)}${tc('{email}', 3600)}</w:tr>
      <w:tr>${tc('電話', 1400)}${tc('{phone}', 3600)}</w:tr>
      <w:tr>${tc('現住所', 1400)}${tc('{current_address}', 3600)}</w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1. キャリアサマリー（自己紹介）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{self_intro}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. 職務経歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3. 学歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4. 保有資格・スキル</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5. 趣味・特技</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{hobbies_skills}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return buildMinimalDocx(docXml);
}

// ── 職務経歴書 with photo: first table 氏名 | 写真 (merged) ──
function buildShokumuPhotoDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>職務経歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>氏名</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2600" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{name}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1200" w:type="dxa"/>${tcBorder}<w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>__PHOTO__</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('メールアドレス', 1200)}${tc('{email}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1200)}${tc('{phone}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1200)}${tc('{current_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1. キャリアサマリー（自己紹介）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{self_intro}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. 職務経歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3. 学歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4. 保有資格・スキル</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5. 趣味・特技</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{hobbies_skills}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

function buildMinimalDocx(documentXml) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Resume</dc:title></cp:coreProperties>`;

  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AI Resume</Application></Properties>`;

  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', documentXml);
  zip.file('word/_rels/document.xml.rels', wordRels);
  zip.file('docProps/core.xml', core);
  zip.file('docProps/app.xml', app);
  zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>');

  return zip.generate({ type: 'nodebuffer' });
}

// ── Thin border style for XLSX ──
const thinBorder = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};
const labelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
const sectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEFF5' } };
const XLSX_PHOTO_COL_WIDTH = 18;
const XLSX_PHOTO_BLOCK_ROW_HEIGHT = 22;
const XLSX_PHOTO_BLOCK_RIREKISHO_ROWS = { start: 1, end: 10 };

function attachXlsxTagsSheet(workbook, tags) {
  const ws = workbook.addWorksheet('_meta_tags');
  ws.state = 'veryHidden';
  ws.getCell('A1').value = 'key';
  ws.getCell('B1').value = 'value';
  let row = 2;
  for (const [key, value] of Object.entries(tags || {})) {
    ws.getCell(`A${row}`).value = key;
    ws.getCell(`B${row}`).value = String(value);
    row++;
  }
}

// ── Build XLSX: JIS 履歴書 (table layout, borders, merged 写真) ──
async function buildRirekishoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });

  // 学歴4行・職歴12行・免許4行で充実した職歴を記載可能に
  const eduRows = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
  const expRows = Array(12).fill(['', '', '']);
  const licRows = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
  const rows = [
    ['日付', '　　　年　　　月　　　日', ''],
    ['氏名', '', ''],
    ['ふりがな', '', ''],
    ['生年月日', '', ''],
    ['性別', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['メールアドレス', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望動機', '', ''],
    ['特技・自己PR', '', ''],
    ['本人希望', '', ''],
  ];

  const rEducation = 10;
  const rExperience = rEducation + 1 + eduRows.length + 1;
  const rLicenses = rExperience + 1 + expRows.length + 1;
  const sepRows = new Set([rEducation, rExperience, rLicenses]); // 学歴・職歴・免許のヘッダー行
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      const isDataRow = r > 10 && !sepRows.has(r) && row[0] === '' && row[1] === '' && row[2] === '';
      if (isDataRow && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });

  ws.mergeCells('C1:C6');
  ws.getCell('C1').value = '';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('C1').border = thinBorder;

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = XLSX_PHOTO_COL_WIDTH;
  ws.getRow(1).height = 20;
  for (let r = XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.start; r <= XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.end; r++) {
    ws.getRow(r).height = XLSX_PHOTO_BLOCK_ROW_HEIGHT;
  }
  const totalRows = rows.length;
  for (let r = 10; r <= totalRows; r++) {
    ws.getRow(r).height = sepRows.has(r) ? 20 : 22;
  }

  attachXlsxTagsSheet(wb, {
    'sheet.main': '履歴書',
    'photo.anchor': 'C1',
    'field.name': 'B2',
    'field.furigana': 'B3',
    'field.birthdate': 'B4',
    'field.gender': 'B5',
    'field.current_address': 'B6',
    'field.phone': 'B7',
    'field.email': 'B8',
    'section.education.start': '11',
    'section.education.end': '14',
    'section.experience.start': '17',
    'section.experience.end': '28',
    'section.licenses.start': '31',
    'section.licenses.end': '34',
    'section.yearCol': 'A',
    'section.monthCol': 'B',
    'section.contentCol': 'C',
    'field.motivation': 'C35',
    'field.self_pr': 'C36',
    'field.preferences': 'C37',
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 職務経歴書 XLSX: table with borders, section headers ──
async function buildShokumuXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('職務経歴書', { views: [{ showGridLines: true }] });
  const rows = [
    ['氏名', ''],
    ['メールアドレス', ''],
    ['電話', ''],
    ['現住所', ''],
    ['', ''],
    ['1. キャリアサマリー（自己紹介）', ''],
    ['', ''],
    ['2. 職務経歴', ''],
    ['', ''],
    ['3. 学歴', ''],
    ['', ''],
    ['4. 保有資格・スキル', ''],
    ['', ''],
    ['5. 趣味・特技', ''],
  ];

  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (c === 0 && cellVal && !String(cellVal).startsWith('1.') && !String(cellVal).startsWith('2.') && !String(cellVal).startsWith('3.') && !String(cellVal).startsWith('4.') && !String(cellVal).startsWith('5.')) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
      if (r === 6 || r === 8 || r === 10 || r === 12 || r === 14) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
    });
  });

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 58;
  for (let r = 7; r <= 15; r += 2) ws.getRow(r).height = 60;

  attachXlsxTagsSheet(wb, {
    'sheet.main': '職務経歴書',
    'field.name': 'B1',
    'field.email': 'B2',
    'field.phone': 'B3',
    'field.current_address': 'B4',
    'field.self_intro': 'B7',
    'field.experience': 'B9',
    'field.education': 'B11',
    'field.licenses': 'B13',
    'field.hobbies_skills': 'B15',
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 履歴書 Photo XLSX: 写真をはる位置、学歴・職歴・免許は多行対応 ──
async function buildRirekishoPhotoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });
  const eduRows = Array(4).fill(['', '', '']);
  const expRows = Array(12).fill(['', '', '']);
  const licRows = Array(4).fill(['', '', '']);
  const rows = [
    ['ふりがな', '', ''],
    ['氏名', '', ''],
    ['生年月日', '', ''],
    ['（年齢）', '', ''],
    ['性別', '', ''],
    ['国籍', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['E-mail', '', ''],
    ['連絡先', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴（各別にまとめて書く）'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望の動機・特技・アピール', '', ''],
    ['本人希望記入欄', '', ''],
  ];
  const sepRows = new Set([12, 12 + 1 + eduRows.length + 1, 12 + 1 + eduRows.length + 1 + 1 + expRows.length + 1]);
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      else if (row[0] === '' && row[1] === '' && row[2] === '' && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });
  ws.mergeCells('C1:C10');
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = XLSX_PHOTO_COL_WIDTH;
  for (let r = XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.start; r <= XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.end; r++) {
    ws.getRow(r).height = XLSX_PHOTO_BLOCK_ROW_HEIGHT;
  }
  for (let r = 11; r <= rows.length; r++) ws.getRow(r).height = 22;
  attachXlsxTagsSheet(wb, {
    'sheet.main': '履歴書',
    'photo.anchor': 'C1',
    'field.furigana': 'B1',
    'field.name': 'B2',
    'field.birthdate': 'B3',
    'field.age': 'B4',
    'field.gender': 'B5',
    'field.nationality': 'B6',
    'field.current_address': 'B7',
    'field.phone': 'B8',
    'field.email': 'B9',
    'field.contact_address': 'B10',
    'section.education.start': '13',
    'section.education.end': '16',
    'section.experience.start': '19',
    'section.experience.end': '30',
    'section.licenses.start': '33',
    'section.licenses.end': '36',
    'section.yearCol': 'A',
    'section.monthCol': 'B',
    'section.contentCol': 'C',
    'field.motivation': 'C37',
    'field.preferences': 'C38',
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 履歴書 Full XLSX: 連絡先・年齢・学歴・職歴・免許を多行で充実記載 ──
async function buildRirekishoFullXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });
  const eduRows = Array(4).fill(['', '', '']);
  const expRows = Array(12).fill(['', '', '']);
  const licRows = Array(4).fill(['', '', '']);
  const rows = [
    ['日付', '　　　年　　　月　　　日現在', ''],
    ['氏名', '', ''],
    ['ふりがな', '', ''],
    ['生年月日', '', ''],
    ['年齢', '', ''],
    ['性別', '', ''],
    ['国籍', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['E-mail', '', ''],
    ['連絡先', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴（各別にまとめて書く）'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望の動機・特技・アピール', '', ''],
    ['本人希望記入欄', '', ''],
  ];
  const sepRows = new Set([13, 13 + 1 + eduRows.length + 1, 13 + 1 + eduRows.length + 1 + 1 + expRows.length + 1]);
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      else if (row[0] === '' && row[1] === '' && row[2] === '' && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });
  ws.mergeCells('C1:C7');
  ws.getCell('C1').value = '';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = XLSX_PHOTO_COL_WIDTH;
  for (let r = 1; r <= rows.length; r++) ws.getRow(r).height = r <= 11 ? 22 : (sepRows.has(r) ? 20 : 22);
  for (let r = XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.start; r <= XLSX_PHOTO_BLOCK_RIREKISHO_ROWS.end; r++) {
    ws.getRow(r).height = XLSX_PHOTO_BLOCK_ROW_HEIGHT;
  }
  attachXlsxTagsSheet(wb, {
    'sheet.main': '履歴書',
    'photo.anchor': 'C1',
    'field.name': 'B2',
    'field.furigana': 'B3',
    'field.birthdate': 'B4',
    'field.age': 'B5',
    'field.gender': 'B6',
    'field.nationality': 'B7',
    'field.current_address': 'B8',
    'field.phone': 'B9',
    'field.email': 'B10',
    'field.contact_address': 'B11',
    'section.education.start': '14',
    'section.education.end': '17',
    'section.experience.start': '20',
    'section.experience.end': '31',
    'section.licenses.start': '34',
    'section.licenses.end': '37',
    'section.yearCol': 'A',
    'section.monthCol': 'B',
    'section.contentCol': 'C',
    'field.motivation': 'C38',
    'field.preferences': 'C39',
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 職務経歴書 with photo XLSX ──
async function buildShokumuPhotoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('職務経歴書', { views: [{ showGridLines: true }] });
  const headerBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
  const rows = [
    ['氏名', '', ''],
    ['メールアドレス', '', ''],
    ['電話', '', ''],
    ['現住所', '', ''],
    ['', '', ''],
    ['1. キャリアサマリー（自己紹介）', '', ''],
    ['', '', ''],
    ['2. 職務経歴', '', ''],
    ['', '', ''],
    ['3. 学歴', '', ''],
    ['', '', ''],
    ['4. 保有資格・スキル', '', ''],
    ['', '', ''],
    ['5. 趣味・特技', '', ''],
  ];
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (c === 0 && cellVal && !String(cellVal).startsWith('1.') && !String(cellVal).startsWith('2.') && !String(cellVal).startsWith('3.') && !String(cellVal).startsWith('4.') && !String(cellVal).startsWith('5.')) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
      if (r === 6 || r === 8 || r === 10 || r === 12 || r === 14) { cell.fill = headerBg; cell.font = { bold: true }; }
    });
  });
  ws.mergeCells('C1:C4');
  ws.getCell('C1').value = '';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 42;
  ws.getColumn(3).width = XLSX_PHOTO_COL_WIDTH;
  for (let r = 1; r <= 4; r++) ws.getRow(r).height = XLSX_PHOTO_BLOCK_ROW_HEIGHT;
  for (let r = 7; r <= 13; r += 2) ws.getRow(r).height = 60;
  attachXlsxTagsSheet(wb, {
    'sheet.main': '職務経歴書',
    'photo.anchor': 'C1',
    'field.name': 'B1',
    'field.email': 'B2',
    'field.phone': 'B3',
    'field.current_address': 'B4',
    'field.self_intro': 'B7',
    'field.experience': 'B9',
    'field.education': 'B11',
    'field.licenses': 'B13',
    'field.hobbies_skills': 'B15',
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function getTemplateBuffer(templateId) {
  switch (templateId) {
    case TEMPLATE_IDS.RIREKISHO_JIS_DOCX:
      return buildRirekishoDocx();
    case TEMPLATE_IDS.RIREKISHO_JIS_XLSX:
      return buildRirekishoXlsx();
    case TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX:
      return buildRirekishoPhotoDocx();
    case TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX:
      return buildRirekishoPhotoXlsx();
    case TEMPLATE_IDS.RIREKISHO_FULL_DOCX:
      return buildRirekishoFullDocx();
    case TEMPLATE_IDS.RIREKISHO_FULL_XLSX:
      return buildRirekishoFullXlsx();
    case TEMPLATE_IDS.VOICE_RIREKISHO_DOCX:
      // Dedicated voice-filled template (DOCX with photo box)
      return buildRirekishoPhotoDocx();
    case TEMPLATE_IDS.SHOKUMU_DOCX:
      return buildShokumuDocx();
    case TEMPLATE_IDS.SHOKUMU_XLSX:
      return buildShokumuXlsx();
    case TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX:
      return buildShokumuPhotoDocx();
    case TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX:
      return buildShokumuPhotoXlsx();
    default:
      return null;
  }
}
