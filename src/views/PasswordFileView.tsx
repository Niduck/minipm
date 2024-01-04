import {SyntheticEvent, useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import PasswordsIDB from "../db/PasswordsIDB.ts";
import {type Password} from "../models/Password.ts";
import PasswordModal from "./components/PasswordModal.tsx";
import {Badge, Button, Tooltip} from "flowbite-react";
import Icon from "../components/Icon.tsx";
import {PrivateKeyContext} from "../context/PrivateKeyContext.tsx";
import PrivateKeyModal from "./components/PrivateKeyModal.tsx";
import {useEncryption} from "../hooks/useEncryption.tsx";
import Base64Converter from "../services/Base64Converter.tsx";
import MinipmFileWriter from "../services/MinipmFileWriter.tsx";
import MinipmFileReader from "../services/MinipmFileReader.tsx";
import uniqid from "uniqid";
import Encryption from "../services/Encryption.ts";
import {SecretFile} from "../models/SecretFile.ts";
import base64Converter from "../services/Base64Converter.tsx";

interface MinipmPasswordRequestDetail {
    publicKey: string;
    location: Location; // Supposons que Location est un type défini ailleurs
}

declare global {
    interface WindowEventMap {
        "minipmPasswordRequest": CustomEvent<MinipmPasswordRequestDetail>;
    }
}

function PasswordFileView() {
    const {privateKey} = useContext(PrivateKeyContext);
    const navigate = useNavigate();
    const [files, setFiles] = useState<SecretFile[]>([])
    const [passwords, setPasswords] = useState<Password[]>([])
    const [privateKeyModalOpen, setPrivateKeyModalOpen] = useState(false)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [passwordModalData, setPasswordModalData] = useState<Password | null>(null)

    const {encrypt, decrypt, generateKey} = useEncryption();
    useEffect(() => {
        if (!privateKey) {
            setPrivateKeyModalOpen(true)
        }
    }, [privateKey]);

    window.addEventListener('minipmPasswordRequest', async function (e: CustomEvent<MinipmPasswordRequestDetail>) {
        const data = e.detail;
        const publicKeyArrayBuffer = Uint8Array.from(atob(data.publicKey), c => c.charCodeAt(0)).buffer;

        const publicKey = await window.crypto.subtle.importKey(
            "spki", // Format pour les clés publiques
            publicKeyArrayBuffer,
            {
                name: "RSA-OAEP",
                hash: {name: "SHA-256"}, // Assure-toi que cela correspond au hash utilisé lors de la génération de la clé
            },
            true,
            ["encrypt"]
        )
        const password = passwords.find(p => {
            return p.domain && data.location.hostname.includes(p.domain)
        })
        if (password && privateKey) {
            const decryptedPassword = await decrypt(privateKey.key, password.secret as string);
            const key = await generateKey()
            const newKeyEncryptedPassword = await encrypt(key, decryptedPassword)
            const encryptedKey = await window.crypto.subtle.encrypt({
                    name: 'RSA-OAEP'
                }, publicKey,
                await window.crypto.subtle.exportKey("raw", key)
            )

            const event = new CustomEvent('minipmPasswordResponse',
                {
                    detail: {
                        ...e.detail,
                        base64Key: Base64Converter.toBase64(encryptedKey),
                        base64Password: Base64Converter.toBase64(newKeyEncryptedPassword)
                    }
                });
            window.dispatchEvent(event);
        }
    });

    function passwordModalOnClose(data?: Password) {
        if (data) {
            const index = passwords.findIndex(item => item.id === data.id);
            if (index > -1) {
                //it's an edit
                setPasswords(prevState => [...prevState.slice(0, index), data, ...prevState.splice(index + 1)])

            } else {
                setPasswords(prevState => [...prevState, data])
            }
        }
        setPasswordModalOpen(false)
        setPasswordModalData(null)
    }

    function passwordModalOnOpen(_event: SyntheticEvent, password?: Password) {
        if (password) {
            setPasswordModalData(password)
        }
        setPasswordModalOpen(true)
    }

    useEffect(() => {
        (async function () {
            const passwordDB = (await PasswordsIDB);
            const data = await passwordDB.all()
            setPasswords(data.filter(item => item.type === 'password'))
            setFiles(data.filter(item => item.type === 'file'))
        })()
    }, []);

    async function savePasswordFile() {
        try {
            if ('showSaveFilePicker' in window) {
                const storage = localStorage.getItem("minipm_lock");
                if (storage) {
                    const lock = JSON.parse(storage);
                    // @ts-ignore
                    const fileHandle = await window.showSaveFilePicker({
                        types: [{
                            description: 'Text Files',
                            accept: {'text/plain': ['.minipm']},
                        }],
                        suggestedName: lock.name + '.minipm'
                    });

                    const writable = await fileHandle.createWritable();
                    const data = await MinipmFileWriter(1)
                    await writable.write(data);
                    await writable.close();
                    await closePasswordFile()
                }

            } else {
                console.log("L'API File System Access n'est pas disponible dans ce navigateur.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleFileAdd() {
        try {
            if ('showOpenFilePicker' in window) {
                // @ts-ignore
                const [fileHandle] = await window.showOpenFilePicker({});
                const file = await fileHandle.getFile();
                const fileReader = new FileReader();
                fileReader.onload = async function (e) {
                    const result = e.target?.result;
                    if (result && result instanceof ArrayBuffer) {
                        const id = uniqid.time();
                        const secretFile: SecretFile = {
                            id: id,
                            name: file.name,
                            type: "file",
                            secret: {
                                content: Base64Converter.toBase64(result)
                            }
                        };
                        //-- Encrypt the secret part of the password
                        if (privateKey) {
                            const encryption = Encryption();
                            const encodedSecret = (new TextEncoder).encode(JSON.stringify(secretFile.secret))
                            const encrypted = await encryption.symmetric.encrypt(privateKey.key, encodedSecret);
                            secretFile.secret = Base64Converter.toBase64(encrypted)
                            //-- Save data in indexedDB
                            const idb = await PasswordsIDB
                            idb.add(id, secretFile)
                            setFiles(prevState => [...prevState, secretFile])
                        }
                    }
                }
                fileReader.readAsArrayBuffer(file)
            } else {
                console.log("L'API File System Access n'est pas disponible dans ce navigateur.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleFileDownload(file: SecretFile) {
        try {
            if ('showSaveFilePicker' in window) {
                // @ts-ignore
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: file.name
                });

                if (privateKey) {
                    const decryptedPassword = await decrypt(privateKey.key, file.secret as string);
                    const content = base64Converter.toUint8Array(decryptedPassword.content);
                    const writable = await fileHandle.createWritable();
                    await writable.write(content.buffer);
                    await writable.close();
                }

            } else {
                console.log("L'API File System Access n'est pas disponible dans ce navigateur.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function deletePassword(e: SyntheticEvent, secret: Password | SecretFile) {
        e.preventDefault()
        e.stopPropagation()
        const collection = secret.type === 'password' ? passwords : files;
        const index = collection.findIndex(item => item.id === secret.id);
        if (index > -1) {
            const passwordDB = (await PasswordsIDB);
            passwordDB.delete(secret.id);
            collection.splice(index, 1)
            switch (secret.type) {
                case 'password':
                    setPasswords([...collection as Password[]])
                    break;
                case 'file':
                    setFiles([...collection as SecretFile[]])
                    break;

            }
        }
    }

    async function closePasswordFile() {
        await (await PasswordsIDB).clear()
        localStorage.removeItem('minipm_lock')
        navigate('/')
    }

    return (
        <>
            <div className={`${privateKeyModalOpen ? 'blur-sm' : ''}  flex flex-col w-full h-full`}>
                <div className={'flex flex-col py-3 w-full'}>
                    <div className="flex gap-3 justify-end">
                        <Button color={"purple"} size={"sm"} onClick={passwordModalOnOpen}>
                            <div className="flex gap-1.5 items-center">
                                <Icon name={"pluscircle"} size={16}></Icon>
                                New password
                            </div>
                        </Button>
                        <Button color={"blue"} size={"sm"} onClick={handleFileAdd}>
                            <div className="flex gap-1.5 items-center">
                                <Icon name={"pluscircle"} size={16}></Icon>
                                New file
                            </div>
                        </Button>
                        <Tooltip placement={"bottom"}
                                 content="By downloading the file, the browser's internal backup will be cleared."
                                 style="dark">
                            <Button color={"light"} size={"sm"} outline onClick={savePasswordFile}>
                                <div className="flex gap-1.5 items-center">
                                    <Icon name={"download"} size={16}></Icon>
                                </div>
                            </Button>
                        </Tooltip>
                        <Tooltip placement={"bottom"}
                                 content="Closes the file. Remember to save any changes by using the download button; otherwise, they will be lost."
                                 style="dark">
                            <Button color={"light"} size={"sm"} outline onClick={closePasswordFile}>
                                <div className="flex gap-1.5 items-center">
                                    <Icon name={"close"} size={16}></Icon>
                                </div>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <div className="flex flex-col gap-3  overflow-y-auto items-stretch p-6 my-3  h-full w-full">
                    <h2 className={"w-full opacity-60 border-b pb-3"}>Passwords</h2>

                    {passwords.map(function (password) {
                        return (
                            <div key={password.id}
                                 onClick={(event: SyntheticEvent) => {
                                     passwordModalOnOpen(event, password)
                                 }}
                                 className="flex gap-6 w-full h-fit items-stretch py-3 bg-white px-3  border border-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">
                                <div className="flex gap-1.5 flex-col flex-grow-0 flex-shrink-0">
                                    <div className="text-xs">Type</div>
                                    <div className="font-semibold h-full flex items-center">

                                        <Badge color="purple" className={"w-fit"}>
                                            Password
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col h-auto flex-grow">
                                    <div className="text-xs ">Name</div>
                                    <h4 className="font-semibold h-full flex items-center">{password.name}</h4>
                                </div>
                                <div className={"flex flex-col h-auto flex-grow-0 flex-shrink-0 justify-end gap-3"}>

                                    <div className="text-xs opacity-40">Actions</div>
                                    <Button.Group>
                                        <Button size={"xs"} color={"light"}>
                                            <Icon name={"eye"} size={19}></Icon>
                                        </Button>
                                        <Button size={"xs"} color={"light"}>
                                            <Icon name={"edit"} size={19}></Icon>
                                        </Button>
                                        <Button onClick={(e: SyntheticEvent) => {
                                            deletePassword(e, password)
                                        }} size={"xs"} color={"light"}>
                                            <Icon name={"trash"} size={19}></Icon>
                                        </Button>
                                    </Button.Group>
                                </div>
                            </div>
                        )
                    })}
                    <h2 className={"w-full opacity-60 border-b py-3"}>Files</h2>
                    {files.map(function (file) {
                        return (
                            <div key={file.id}
                                 className="flex gap-6 w-full h-fit items-stretch py-3 bg-white px-3  border border-gray-200 rounded-md hover:bg-gray-100 cursor-pointer">
                                <div className="flex gap-1.5 flex-col flex-grow-0 flex-shrink-0">
                                    <div className="text-xs">Type</div>
                                    <div className="font-semibold h-full flex items-center">

                                        <Badge color="blue" className={"w-fit"}>
                                            File
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col h-auto flex-grow">
                                    <div className="text-xs ">Name</div>
                                    <h4 className="font-semibold h-full flex items-center">{file.name}</h4>
                                </div>
                                <div className={"flex flex-col h-auto flex-grow-0 flex-shrink-0 justify-end gap-3"}>

                                    <div className="text-xs opacity-40">Actions</div>
                                    <Button.Group>

                                        <Button onClick={(e: SyntheticEvent) => {
                                            handleFileDownload(file)
                                        }} size={"xs"} color={"light"}>
                                            <Icon name={"download"} size={19}></Icon>
                                        </Button>
                                        <Button onClick={(e: SyntheticEvent) => {
                                            deletePassword(e, file)
                                        }} size={"xs"} color={"light"}>
                                            <Icon name={"trash"} size={19}></Icon>
                                        </Button>
                                    </Button.Group>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <PrivateKeyModal isOpen={privateKeyModalOpen} onClose={(unlocked) => {
                if (!unlocked) {
                    navigate("/")
                } else {
                    setPrivateKeyModalOpen(false)
                }
            }}></PrivateKeyModal>
            <PasswordModal isOpen={passwordModalOpen} defaultValue={passwordModalData}
                           onClose={passwordModalOnClose}></PasswordModal>
        </>
    )
}

export default PasswordFileView
