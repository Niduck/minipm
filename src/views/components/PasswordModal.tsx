import {Button, Label, Modal, Textarea, TextInput, Tooltip} from "flowbite-react";
import {SyntheticEvent, useContext, useEffect, useRef, useState} from "react";
import uniqid from 'uniqid';
import {PrivateKeyContext} from "../../context/PrivateKeyContext.tsx";
import PasswordsIDB from "../../db/PasswordsIDB.ts";
import Encryption from "../../services/Encryption.ts";
import {type Password} from "../../models/Password.ts";
import Base64Converter from "../../services/Base64Converter.tsx";
import Icon from "../../components/Icon.tsx";
import PasswordGeneratorModal from "./PasswordGeneratorModal.tsx";


function PasswordModal({isOpen, onClose, defaultValue}: { isOpen: boolean, onClose: (data?: Password) => void, defaultValue?: Password | null }) {

    const {privateKey} = useContext(PrivateKeyContext);
    const formRef = useRef(null)
    const passwordInput = useRef<HTMLInputElement>(null)
    const [passwordGeneratorModal, setPasswordGeneratorModal] = useState(false)
    const [value, setValue] = useState<Password | null>(null)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        (async function () {
            if ((defaultValue && typeof defaultValue.secret === 'string') && privateKey) {
                const encryption = Encryption();
                const encodedSecret = defaultValue.secret
                try {
                    const decrypted = await encryption.symmetric.decrypt(privateKey.key, Base64Converter.toUint8Array(encodedSecret));
                    setValue({
                        ...defaultValue,
                        secret: JSON.parse((new TextDecoder).decode(decrypted))
                    })

                } catch (e) {
                    console.log(e)
                }

            }
        })()
    }, [defaultValue, privateKey]);

    async function handleSave() {
        setIsLoading(true)
        if (!formRef.current) {
            return false;
        }
        //Get data from the formRef
        const formData = new FormData(formRef.current);
        const id = defaultValue?.id || uniqid.time();
        const password: Password = {
            id: id,
            name: formData.get('name') as string,
            type: 'password',
            domain: formData.get('domain') as string,
            secret: {
                username: formData.get('secret.username') as string,
                password: formData.get('secret.password') as string,
                note: formData.get('secret.note') as string
            }
        };
        //-- Encrypt the secret part of the password
        if (privateKey) {
            const encryption = Encryption();
            const encodedSecret = (new TextEncoder).encode(JSON.stringify(password.secret))
            const encrypted = await encryption.symmetric.encrypt(privateKey.key, encodedSecret);
            password.secret = Base64Converter.toBase64(encrypted)
            //-- Save data in indexedDB
            const idb = await PasswordsIDB
            if (defaultValue?.id) {
                //it's an edit
                idb.update(id, password)
            } else {

                idb.add(id, password)
            }
            //-- Close
            setIsLoading(false)
            _onClose(null, password)
        }
    }

    function _onClose(_event?: SyntheticEvent|null, data?: Password) {
        setValue(null)
        setPasswordVisible(false)
        setIsLoading(false)
        setPasswordGeneratorModal(false)
        onClose?.(data)
    }

    function handleCopy() {
        if (passwordInput.current) {
            navigator.clipboard.writeText(passwordInput.current.value);
        }
    }

    return (
        <>
            <Modal size={"4xl"} show={isOpen} onClose={_onClose}>
                <Modal.Header>{
                    defaultValue ? "Edit password" : "New password"
                }</Modal.Header>
                <Modal.Body>
                    {typeof value?.secret !== "string" && (
                        <form ref={formRef} autoComplete={"off"} className="flex w-full items-stretch gap-12">
                            <div className={"w-1/2 flex justify-evenly flex-col gap-3"}>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="name" value="Name"/>
                                    </div>
                                    <TextInput autoComplete={"off"} name="name" defaultValue={value?.name} id="name"
                                               type="text"
                                               placeholder="my_secret_password" required/>
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="domain" value="Domain*"/>
                                    </div>
                                    <TextInput autoComplete={"off"} name="domain"
                                               defaultValue={value?.domain}
                                               id="domain" type="text"
                                               required/>
                                    <div className={"text-xs mt-1.5 text-gray-500"}>*The domain is the purple part of the url : https://<span className="text-purple-600">website.net</span>/page</div>
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="username" value="Username"/>
                                    </div>
                                    <TextInput autoComplete={"off"} name="secret.username"
                                               defaultValue={value?.secret.username}
                                               id="username" type="text"
                                               required/>
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="password" value="Password"/>
                                    </div>
                                    <div className={"flex gap-1.5"}>

                                        <TextInput ref={passwordInput} className={"w-full"} autoComplete={"nope"}
                                                   defaultValue={value?.secret.password} readOnly
                                                   onFocus={(e) => {
                                                       //Only way found to prevent autocomplete by Chrome
                                                       e.target.removeAttribute('readonly')
                                                   }} name="secret.password" id="password"
                                                   type={passwordVisible ? "text" : "password"} required/>
                                        <div className={"flex gap-1.5"}>
                                            <Button size={"xs"} color={"light"} onClick={() => {
                                                setPasswordVisible(prevState => !prevState)
                                            }}>
                                                <Icon name={passwordVisible ? "eyeoff" : "eye"} size={19}></Icon>
                                            </Button>
                                            <Button size={"xs"} color={"light"} onClick={() => {
                                                setPasswordGeneratorModal(true)
                                            }}>
                                                <Icon name={"refresh"} size={19}></Icon>
                                            </Button>
                                            <Tooltip trigger={"click"} content={"Copied to clipboard !"}>

                                                <Button color={"light"} onClick={handleCopy}>
                                                    <Icon name={"copy"} size={19}></Icon>
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={"w-1/2"}>
                                <div className="mb-2 block">
                                    <Label htmlFor="password" value="Note"/>
                                </div>
                                <Textarea className={"h-3/4"} autoComplete={"off"} defaultValue={value?.secret.note}
                                          name="secret.note" id="note"
                                          required/>
                            </div>
                        </form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="mx-auto">
                        <Button color="purple" disabled={isLoading} onClick={handleSave}>Continue</Button>
                    </div>
                </Modal.Footer>
            </Modal>
            <PasswordGeneratorModal isOpen={passwordGeneratorModal} onClose={(data: string|undefined) => {
                if (passwordInput.current && data) {
                    passwordInput.current.value = data
                }
                setPasswordGeneratorModal(false)
            }}></PasswordGeneratorModal>
        </>
    )
}

export default PasswordModal