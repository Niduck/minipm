
export interface Password {
    id: string
    name: string,
    secret: {
        username:string,
        password: string,
        note: string
    } | string
}
