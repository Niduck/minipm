import {Button, Label, Modal, TextInput} from "flowbite-react";
import  {useContext, useRef, useState} from "react";
import {PrivateKeyContext} from "../../context/PrivateKeyContext.tsx";
import Encryption from "../../services/Encryption.ts";
import {type PrivateKey} from "../../models/PrivateKey.ts";
import Icon from "../../components/Icon.tsx";
import PasswordGeneratorModal from "./PasswordGeneratorModal.tsx";

function PasswordFileModal({isOpen, onClose}:{isOpen:boolean, onClose: (data?:string)=>void}) {

    const {setPrivateKey} = useContext(PrivateKeyContext);

    const formRef = useRef(null)
    const secretKeyRef = useRef<HTMLInputElement|null>(null)
    const [secretKeyVisible, setSecretKeyVisible] = useState(false)
    const [passwordGeneratorModal, setPasswordGeneratorModal] = useState(false)

    async function handleSave() {
        if (!formRef.current) {
            return false;
        }
        if (setPrivateKey) {
            const formData = new FormData(formRef.current);
            const encryption = Encryption();
            const cryptoKey = await encryption.key.deriveKey(formData.get('secretkey') as string);
            setPrivateKey(cryptoKey as PrivateKey)
            localStorage.setItem("minipm_lock", JSON.stringify({
                name: formData.get('filename'), salt: cryptoKey.salt
            }))
            _onClose(formData.get('filename') as string)
        }

    }

    function _onClose(data?: string) {
        onClose?.(data)
    }

    return (
        <>
            <Modal show={isOpen} onClose={_onClose}>
                <Modal.Header>Créer un fichier de mot passe</Modal.Header>
                <Modal.Body>
                    <form id="rr" ref={formRef} autoComplete={"off"} className="flex w-full flex-col gap-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="filename" value="Nom du fichier"/>
                            </div>
                            <TextInput autoComplete={"off"} name="filename" id="filename" type="text"
                                       placeholder="mon_super_projet" required/>
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="secretkey" value="Clé de sécurité"/>
                            </div>
                            <div className={"flex gap-1.5"}>

                                <div className="flex flex-col items-start">
                                    <TextInput ref={secretKeyRef} className={"w-full"} autoComplete={"nope"}
                                               readOnly
                                               onFocus={(e) => {
                                                   //Only way found to prevent autocomplete by Chrome
                                                   e.target.removeAttribute('readonly')
                                               }} name="secretkey" id="secretkey"
                                               helperText={"C'est le mot de passe qui servira à chiffrer les données pour ce fichier. Il vous sera demandé plus tard, ne le perdez pas."}
                                               type={secretKeyVisible ? "text" : "password"} required/>
                                </div>
                                <div className={"flex gap-1.5  items-start"}>
                                    <Button size={"sm"} color={"light"} onClick={() => {
                                        setSecretKeyVisible(prevState => !prevState)
                                    }}>
                                        <Icon name={secretKeyVisible ? "eyeoff" : "eye"} size={19}></Icon>
                                    </Button>
                                    <Button size={"sm"} color={"light"} onClick={() => {
                                        setPasswordGeneratorModal(true)
                                    }}>
                                        <Icon name={"refresh"} size={19}></Icon>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>

                </Modal.Body>
                <Modal.Footer>
                    <div className="mx-auto">
                        <Button onClick={handleSave}>Valider</Button>
                    </div>
                </Modal.Footer>
            </Modal>
            <PasswordGeneratorModal isOpen={passwordGeneratorModal} onClose={(password?: string) => {
                if(secretKeyRef.current && password){
                    secretKeyRef.current.value = password
                }
                setPasswordGeneratorModal(false)
            }}></PasswordGeneratorModal>
        </>
    )
}

export default PasswordFileModal