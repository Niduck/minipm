import passwordsIDB from "../db/PasswordsIDB.ts";
import {V1File} from "../models/V1File.ts";

export default async function MinipmFileReader(jsonString:string){
    try{
        const json = JSON.parse(jsonString)
        switch(json.version){
            case 1:
                return await parseV1File(json as V1File)
        }
    }catch(e){
        console.log(e)
        throw new Error('jsonString is not a valid json string')
    }
}

async function parseV1File(json: V1File){
    localStorage.setItem('minipm_lock', JSON.stringify(json.data.storage))
    const _passwordsIDB = await passwordsIDB
    const passwords = json.data.db;
    for (const password of passwords) {
        _passwordsIDB.add(password.id, password)
    }
    return true
}