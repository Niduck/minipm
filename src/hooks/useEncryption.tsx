import {useContext} from "react";
import {PrivateKeyContext} from "../context/PrivateKeyContext.tsx";
import Encryption from "../services/Encryption.ts";
import Base64Converter from "../services/Base64Converter.tsx";
import PasswordsIDB from "../db/PasswordsIDB.ts";

export function useEncryption(){
    const {privateKey} = useContext(PrivateKeyContext);

    async function decrypt(key: CryptoKey, data:string){
        if (data && privateKey) {
            const encryption = Encryption();
            try {
                const decrypted = await encryption.symmetric.decrypt(key, Base64Converter.toUint8Array(data));
                return JSON.parse((new TextDecoder).decode(decrypted))

            } catch (e) {
                console.log(e)
            }

        }
    }

    async function encrypt(key: CryptoKey, data:object){
            const encryption = Encryption();
            const encodedSecret = (new TextEncoder).encode(JSON.stringify(data))
            return await encryption.symmetric.encrypt(key, encodedSecret)
    }

    async function generateKey(){
        return await window.crypto.subtle.generateKey(
            {
                name: "AES-CBC",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        )
    }

    return {encrypt,decrypt, generateKey}

}