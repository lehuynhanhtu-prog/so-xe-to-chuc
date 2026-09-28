/* Organization file encryption. The passphrase stays in memory for this tab only. */
window.OrgCrypto=(()=>{
  const encoder=new TextEncoder(),decoder=new TextDecoder();
  let passphrase='',saltBytes=null;
  const b64=bytes=>btoa(String.fromCharCode(...bytes));
  const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  function setPassphrase(value){if(passphrase&&value!==passphrase)throw new Error('Không thể đổi mật khẩu mã hóa trong cùng phiên. Hãy tải lại ứng dụng.');if(typeof value!=='string'||value.length<12)throw new Error('Mật khẩu mã hóa tổ chức cần ít nhất 12 ký tự.');passphrase=value}
  function ready(){return Boolean(passphrase)}
  function clear(){passphrase='';saltBytes=null}
  async function key(salt){if(!ready())throw new Error('Hãy nhập mật khẩu mã hóa tổ chức trước khi đồng bộ.');const source=await crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},source,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
  async function encrypt(value){const salt=saltBytes||crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(salt),encoder.encode(JSON.stringify(value)));saltBytes=salt;return JSON.stringify({format:'so-xe-org-encrypted',version:1,kdf:'PBKDF2-SHA256',iterations:310000,cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))})}
  async function decrypt(envelope){if(envelope?.format!=='so-xe-org-encrypted'||envelope.version!==1||envelope.iterations!==310000)throw new Error('Định dạng dữ liệu mã hóa không được hỗ trợ.');try{const salt=bytes(envelope.salt),iv=bytes(envelope.iv);if(salt.length!==16||iv.length!==12)throw Error();const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(salt),bytes(envelope.ciphertext));const parsed=JSON.parse(decoder.decode(plain));if(parsed?.product!=='so-xe-organization'||!Array.isArray(parsed.cars)||!Array.isArray(parsed.expenses))throw Error();saltBytes=salt;return parsed}catch{throw new Error('Không giải mã được dữ liệu. Kiểm tra mật khẩu mã hóa của tổ chức hoặc bản sao lưu.')}}
  async function encryptFile(blob){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(salt),await blob.arrayBuffer());return {blob:new Blob([cipher],{type:'application/octet-stream'}),encryption:{version:1,salt:b64(salt),iv:b64(iv)}}}
  async function decryptFile(blob,metadata){if(metadata?.version!==1)throw new Error('Định dạng mã hóa tệp không hỗ trợ.');try{const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(metadata.iv)},await key(bytes(metadata.salt)),await blob.arrayBuffer());return new Blob([plain])}catch{throw new Error('Không giải mã được tệp đính kèm.')}}
  return {setPassphrase,ready,clear,encrypt,decrypt,encryptFile,decryptFile};
})();
