
export interface SecretFile {
    id: string
    name: string,
    type: string,
    secret: {
        content: string
    } | string
}
