import {Button, Label, Modal, TextInput} from "flowbite-react";
import {SyntheticEvent, useContext, useRef, useState} from "react";
import {PrivateKeyContext} from "../../context/PrivateKeyContext.tsx";
import Encryption from "../../services/Encryption.ts";
import Base64Converter from "../../services/Base64Converter.tsx";
import {PrivateKey} from "../../models/PrivateKey.ts";
import Icon from "../../components/Icon.tsx";

function PrivateKeyModal({isOpen, onClose}: { isOpen: boolean, onClose: () => void }) {

    const {setPrivateKey} = useContext(PrivateKeyContext);
    const formRef = useRef(null)
    const [passwordVisible, setPasswordVisible] = useState(false)

    async function handleSave(event:SyntheticEvent) {
        event.preventDefault()
        if (!formRef.current) {
            console.error("formRef not found")
            return false;
        }
        //Get data from the formRef
        const formData = new FormData(formRef.current);
        if (!formData.get('privateKey')) {
            return;
        }
        const privateKey = formData.get('privateKey') as string
        const encryption = Encryption();
        const storage = localStorage.getItem("minipm_lock");
        if (storage) {
            const lock = JSON.parse(storage);
            if (lock.salt && setPrivateKey) {
                const salt = Base64Converter.toUint8Array(lock.salt)
                const cryptoKey = await encryption.key.deriveKey(privateKey, salt);
                setPrivateKey(cryptoKey as PrivateKey)
                _onClose()
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function _onClose(_event?: SyntheticEvent) {
        onClose?.()
    }

    return (
        <Modal show={isOpen} onClose={_onClose}>
            <Modal.Header>Unlock your file</Modal.Header>
            <Modal.Body>
                <form name="privatekey_form" id="privatekey_form" ref={formRef} autoComplete={"off"}
                      onSubmit={handleSave} className="flex w-full flex-col gap-4">
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password" value="File password"/>
                        </div>
                        <div className="flex gap-1.5">
                            <TextInput className={"w-full"} autoComplete={"off"} readOnly onFocus={(e) => {
                                //Only way found to prevent autocomplete by Chrome
                                e.target.removeAttribute('readonly')
                            }} name="privateKey" id="privateKey" type={passwordVisible ? "text" : "password"} required/>
                            <Button size={"xs"} color={"light"} onClick={() => {
                                setPasswordVisible(prevState => !prevState)
                            }}>
                                <Icon name={passwordVisible ? "eyeoff" : "eye"} size={19}></Icon>
                            </Button>
                        </div>
                    </div>

                </form>
            </Modal.Body>
            <Modal.Footer>
                <div className="mx-auto">
                    <Button color={"purple"} type={"submit"} form={"privatekey_form"}>
                        Unlock
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default PrivateKeyModal