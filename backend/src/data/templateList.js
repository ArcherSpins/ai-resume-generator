/** Built-in template ids and list for GET /templates (no heavy deps). */
export const TEMPLATE_IDS = {
  RIREKISHO_JIS_DOCX: 'rirekisho-jis-docx',
  RIREKISHO_JIS_XLSX: 'rirekisho-jis-xlsx',
  RIREKISHO_PHOTO_DOCX: 'rirekisho-photo-docx',
  RIREKISHO_PHOTO_XLSX: 'rirekisho-photo-xlsx',
  RIREKISHO_FULL_DOCX: 'rirekisho-full-docx',
  RIREKISHO_FULL_XLSX: 'rirekisho-full-xlsx',
  VOICE_RIREKISHO_DOCX: 'voice-rirekisho-docx',
  SHOKUMU_DOCX: 'shokumu-docx',
  SHOKUMU_XLSX: 'shokumu-xlsx',
  SHOKUMU_PHOTO_DOCX: 'shokumu-photo-docx',
  SHOKUMU_PHOTO_XLSX: 'shokumu-photo-xlsx',
};

/** List for API: id, nameKey (i18n), type */
export const TEMPLATE_LIST = [
  { id: TEMPLATE_IDS.RIREKISHO_JIS_DOCX, nameKey: 'templateRirekishoJisDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_JIS_XLSX, nameKey: 'templateRirekishoJisXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX, nameKey: 'templateRirekishoPhotoDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX, nameKey: 'templateRirekishoPhotoXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.RIREKISHO_FULL_DOCX, nameKey: 'templateRirekishoFullDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_FULL_XLSX, nameKey: 'templateRirekishoFullXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.SHOKUMU_DOCX, nameKey: 'templateShokumuDocx', type: 'docx' },
  { id: TEMPLATE_IDS.SHOKUMU_XLSX, nameKey: 'templateShokumuXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX, nameKey: 'templateShokumuPhotoDocx', type: 'docx' },
  { id: TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX, nameKey: 'templateShokumuPhotoXlsx', type: 'xlsx' },
];
