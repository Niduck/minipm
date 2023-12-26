import {SyntheticEvent, useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import PasswordsIDB from "../db/PasswordsIDB.ts";
import {type Password} from "../models/Password.ts";
import PasswordModal from "./components/PasswordModal.tsx";
import {Badge, Button, Tooltip} from "flowbite-react";
import Icon from "../components/Icon.tsx";
import {PrivateKeyContext} from "../context/PrivateKeyContext.tsx";
import PrivateKeyModal from "./components/PrivateKeyModal.tsx";

function PasswordFileView() {
    const {privateKey} = useContext(PrivateKeyContext);
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState<Password[]>([])
    const [privateKeyModalOpen, setPrivateKeyModalOpen] = useState(false)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [passwordModalData, setPasswordModalData] = useState<Password | null>(null)

    useEffect(() => {
        if (!privateKey) {
            setPrivateKeyModalOpen(true)
        }
    }, [privateKey]);

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
        if(password){
            setPasswordModalData(password)
        }
        setPasswordModalOpen(true)
    }

    useEffect(() => {
        (async function () {
            const passwordDB = (await PasswordsIDB);
            setPasswords(await passwordDB.all())
        })()
    }, []);

    async function savePasswordFile() {
        try {
            if ('showSaveFilePicker' in window) {
                const storage = localStorage.getItem("minipm_lock");
                if(storage){
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
                    const data = lock.salt + '__' + JSON.stringify(passwords)
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

    async function deletePassword(e: SyntheticEvent, password:Password) {
        e.preventDefault()
        e.stopPropagation()
        const index = passwords.findIndex(item => item.id === password.id);
        if (index > -1) {
            const passwordDB = (await PasswordsIDB);
            passwordDB.delete(password.id);
            passwords.splice(index, 1)
            setPasswords([...passwords])
        }
    }

    async function closePasswordFile(){
        await (await PasswordsIDB).clear()
        localStorage.removeItem('minipm_lock')
        navigate('/')
    }

    return (
        <>
            <div className="flex flex-col py-3 w-full">
                <div className="flex gap-3 justify-end">
                    <Button color={"purple"} size={"sm"} onClick={passwordModalOnOpen}>
                        <div className="flex gap-1.5 items-center">
                            <Icon name={"pluscircle"} size={16}></Icon>
                            New password
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
                {passwords.map(function (password) {
                    return (
                        <div key={password.id}
                             onClick={(event:SyntheticEvent) => {
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
            </div>
            <PrivateKeyModal isOpen={privateKeyModalOpen} onClose={() => {
                setPrivateKeyModalOpen(false)
            }}></PrivateKeyModal>
            <PasswordModal isOpen={passwordModalOpen} defaultValue={passwordModalData}
                           onClose={passwordModalOnClose}></PasswordModal>
        </>
    )
}

export default PasswordFileView
