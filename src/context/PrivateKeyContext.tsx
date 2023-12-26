import React, {useState} from 'react';
import { type PrivateKey} from "../models/PrivateKey.ts";

const contextData : {privateKey: PrivateKey|null, setPrivateKey: null|((privateKey: PrivateKey|null | ((prevState: PrivateKey|null) => PrivateKey|null)) => void)} = {
    privateKey: null,
    setPrivateKey: null
}
export const PrivateKeyContext = React.createContext(contextData);

export const PrivateKeyProvider = ({ children }: {children: React.ReactNode}) => {
    const [privateKey, setPrivateKey] = useState<PrivateKey|null>(null); // setPrivateKey est définie ici

    return (
        <PrivateKeyContext.Provider value={{ privateKey, setPrivateKey }}>
            {children}
        </PrivateKeyContext.Provider>
    );
};
