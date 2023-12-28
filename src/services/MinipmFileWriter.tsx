import passwordsIDB from "../db/PasswordsIDB.ts";

export default async function MinipmFileWriter(version:number){
    try{
        switch(version){
            case 1:
                return await constructV1File()
            default:
                return await constructV1File()
        }
    }catch(e){
        console.log(e)
    }
}

async function constructV1File(){
    const lock = localStorage.getItem('minipm_lock')
    if(!lock){
        return false
    }
    const storage = JSON.parse(lock)
    const _passwordsIDB = await passwordsIDB
    const db = await _passwordsIDB.all()
    return JSON.stringify({
        version:1,
        data:{
            storage,
            db
        }
    })
}