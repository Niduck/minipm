/** This code is from https://www.isummation.com/blog/convert-arraybuffer-to-base64-string-and-vice-versa/ */
export default {
    toBase64: function (buffer:Uint8Array | ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },
    toUint8Array: function (base64:string, returnBytes?:Uint8Array):Uint8Array {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return returnBytes ? bytes: bytes ;
    }
}