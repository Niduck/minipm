import {Button, Label, Modal, TextInput} from "flowbite-react";
import {SyntheticEvent, useContext, useRef} from "react";
import {PrivateKeyContext} from "../../context/PrivateKeyContext.tsx";
import Encryption from "../../services/Encryption.ts";
import Base64Converter from "../../services/Base64Converter.tsx";
import {PrivateKey} from "../../models/PrivateKey.ts";

function PrivateKeyModal({isOpen, onClose}: { isOpen: boolean, onClose: () => void }) {

    const {setPrivateKey} = useContext(PrivateKeyContext);
    const formRef = useRef(null)

    async function handleSave() {
        if (!formRef.current) {
            return false;
        }
        //Get data from the formRef
        const formData = new FormData(formRef.current);
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
            <Modal.Header>Créer un mot passe</Modal.Header>
            <Modal.Body>
                <form ref={formRef} autoComplete={"off"} className="flex w-full flex-col gap-4">
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password" value="Clé de securité"/>
                        </div>
                        <TextInput autoComplete={"off"} readOnly onFocus={(e) => {
                            //Only way found to prevent autocomplete by Chrome
                            e.target.removeAttribute('readonly')
                        }} name="privateKey" id="privateKey" type="password" required/>
                    </div>

                </form>
            </Modal.Body>
            <Modal.Footer>
                <div className="mx-auto">
                    <Button gradientDuoTone="redToYellow" outline onClick={handleSave}>Valider</Button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default PrivateKeyModal