import {Password} from "./Password.ts";

export interface V1File {
    version: number
    data: {
        storage: {
            name:string,
            salt:string,
            checkKey:{
                original:string,
                digest:string
            }
        },
        db:  Password[]
    },
}
