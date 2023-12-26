import Base64Converter from "./Base64Converter.tsx";

export default function Encryption() {
    const ALG = "AES-CBC";
    const encryption = {
        glue: function (parts: ArrayBuffer[] | Uint8Array[]):Uint8Array {
            let byteLength = 0;
            for (const part of parts) {
                byteLength += part.byteLength;
            }
            const glued = new Uint8Array(byteLength);
            let gluedByteLength = 0;
            for (const part of parts) {
                glued.set(new Uint8Array(part), gluedByteLength);
                gluedByteLength += part.byteLength;
            }

            return glued;
        },
        digest: async function(data:Uint8Array){
            return await crypto.subtle.digest('SHA-256', data);
        },
        key: {
            export: async function (cryptoKey: CryptoKey):Promise<JsonWebKey> {
                return await window.crypto.subtle.exportKey("jwk", cryptoKey);
            },
            import: async function(cryptoKey: JsonWebKey):Promise<CryptoKey>{
                return await window.crypto.subtle.importKey(
                    "jwk", //can be "jwk" or "raw"
                    cryptoKey,
                    {   //this is the algorithm options
                        name: "AES-CBC",
                        length: 256
                    },
                    false, //whether the key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"]
                );
            },
            deriveKey: async function (password: string, salt?: Uint8Array) {
                const enc = new TextEncoder();
                const _salt =
                    salt instanceof Uint8Array && salt.byteLength === 16
                        ? salt
                        : window.crypto.getRandomValues(new Uint8Array(16));
                const importedKey = await window.crypto.subtle
                    .importKey("raw", enc.encode(password), "PBKDF2", false, [
                        "deriveKey",
                    ]);
                const derivedKey = await window.crypto.subtle.deriveKey(
                    {
                        name: "PBKDF2",
                        salt: _salt,
                        iterations: 250000,
                        hash: "SHA-256",
                    },
                    importedKey,
                    {name: ALG, length: 256},
                    true,
                    ["encrypt", "decrypt"]
                );
                console.log('-> derive salt: ',password, _salt)
                return {
                    salt: Base64Converter.toBase64(_salt),
                    key: derivedKey
                };
            },
        },
        symmetric: {
            encrypt: async function (cryptoKey: CryptoKey, data: BufferSource) {
                const _iv = window.crypto.getRandomValues(new Uint8Array(16));
                const encrypted = await window.crypto.subtle.encrypt(
                    {
                        name: ALG,
                        iv: _iv,
                    },
                    cryptoKey,
                    data
                );

                return encryption.glue([_iv, encrypted]);
            },
            decrypt: async function (cryptoKey: CryptoKey, data: Uint8Array) {
                const iv = new Uint8Array(data.slice(0, 16));
                console.log(iv)
                const content = new Uint8Array(data.slice(16, data.length));
                console.log(content)
                try{
                    return await crypto.subtle.decrypt(
                        {
                            name: ALG,
                            iv
                        },
                        cryptoKey,
                        content
                    );
                }catch(e){
                    console.log(e)
                }

            }
        },

    };
    return encryption;
}