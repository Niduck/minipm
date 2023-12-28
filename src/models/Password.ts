
export interface Password {
    id: string
    name: string,
    domain?: string,
    secret: {
        username:string,
        password: string,
        note?: string
    } | string
}
