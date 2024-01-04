
export interface Password {
    id: string
    name: string,
    domain?: string,
    type: string,
    secret: {
        username:string,
        password: string,
        note?: string
    } | string
}
