export default class PasswordGenerator {

    static generate (length:number, levels:string[], urlsafe:boolean) {
        let password = "";
        for (let i = 0; i < length; i++) {
            const chars = "abcdefghijklmnopqrstuvwxyz"
            const numbers = "0123456789"
            const specialChars = "£$&()*+[]@#^!?"
            const specialCharsURLSAFE = "~_-."
            const group = Math.round(Math.abs(Math.random() * levels.length - 1));
            switch (levels[group]) {
                case 'lowercase': {
                    const index = Math.round(Math.abs(Math.random() * chars.length - 1));
                    password += chars[index]
                }
                    break;
                case 'uppercase': {
                    const index = Math.round(Math.abs(Math.random() * (chars.length - 1)));
                    password += chars[index].toUpperCase()
                }
                    break;
                case 'numbers': {
                    const index = Math.round(Math.abs(Math.random() * (numbers.length - 1)));
                    password += numbers[index]
                }
                    break;
                case 'specials': {
                    if (urlsafe) {
                        const index = Math.round(Math.abs(Math.random() * (specialCharsURLSAFE.length - 1)));
                        password += specialCharsURLSAFE[index]
                    } else {
                        const index = Math.round(Math.abs(Math.random() * (specialChars.length - 1)));
                        password += specialChars[index]
                    }
                }
                    break;
            }
        }
        return password;
    }
}