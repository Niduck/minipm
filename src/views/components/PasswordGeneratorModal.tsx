import {Button, Label, Modal, TextInput, ToggleSwitch, Tooltip} from "flowbite-react";
import {SyntheticEvent, useCallback, useEffect, useRef, useState} from "react";
import PasswordGenerator from "../../services/PasswordGenerator.tsx";
import Icon from "../../components/Icon.tsx";
function PasswordGeneratorModal({isOpen, onClose}:{isOpen:boolean, onClose: (data?:string)=>void}) {

    const formRef = useRef(null)
    const [password, setPassword] = useState<string | null>(null)
    const [lowercase, setLowercase] = useState(true)
    const [uppercase, setUppercase] = useState(true)
    const [numbers, setNumbers] = useState(true)
    const [specials, setSpecials] = useState(true)
    const [length, setLength] = useState<string|number>(24)
    const [urlSafe, setUrlSafe] = useState(false)

    const handleGenerate = useCallback(() => {
        const levels = []
        if (lowercase) levels.push('lowercase')
        if (uppercase) levels.push('uppercase')
        if (numbers) levels.push('numbers')
        if (specials) levels.push('specials')
        const password = PasswordGenerator.generate(length as number, levels, urlSafe)
        setPassword(password)
    }, [length, lowercase, numbers, specials, uppercase, urlSafe]);

    useEffect(() => {
        handleGenerate();
    }, [isOpen, handleGenerate]);
    function _onClose(_event?: SyntheticEvent|null, data?: string) {
        onClose?.(data)
    }

    function copyPassword() {
        if (password) {
            navigator.clipboard.writeText(password);
            _onClose(null, password)
        }
    }

    return (
        <Modal show={isOpen} onClose={_onClose}>
            <Modal.Header>Password generator</Modal.Header>
            <Modal.Body>
                <form ref={formRef} autoComplete={"off"} className="flex w-full items-stretch gap-12">
                    <div className={"w-full flex justify-evenly flex-col gap-12"}>
                        <div className="flex w-full justify-start gap-12">
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" value="Lowercase chars (a-z)"/>
                                </div>
                                <ToggleSwitch color={"purple"} checked={lowercase} onChange={setLowercase}/>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" value="Uppercase chars (A-Z)"/>
                                </div>
                                <ToggleSwitch color={"purple"} checked={uppercase} onChange={setUppercase}/>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" value="Numbers"/>
                                </div>
                                <ToggleSwitch color={"purple"} checked={numbers} onChange={setNumbers}/>
                            </div>
                        </div>
                        <div className="flex w-full justify-start gap-12">

                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" value="Special chars (@-#)"/>
                                </div>
                                <ToggleSwitch color={"purple"} checked={specials} onChange={setSpecials}/>
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="name" value="URL safe special chars only (-._~)"/>
                                </div>
                                <ToggleSwitch color={"purple"} checked={urlSafe} onChange={setUrlSafe}/>
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="name" value="Length"/>
                            </div>
                            <TextInput type={"number"} value={length} onChange={(e) => {
                                setLength(e.target.value)
                            }}></TextInput>

                        </div>

                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <div className={"w-full flex flex-col gap-6  items-center justify-center"}>
                    <div className="gap-6 flex justify-center">

                        <div className="text-2xl">
                            {password}
                        </div>
                        {password && (

                            <div className={"flex gap-1.5"}>
                                <Button className={"w-fit mx-auto"} size={"xs"} color="light" onClick={handleGenerate}>
                                    <Icon name={"refresh"} size={20}></Icon>
                                </Button>
                                <Tooltip trigger={"click"} content={"Copied to clipboard !"}>
                                    <Button className={"w-fit mx-auto"} size={"xs"} color="light"
                                            onClick={copyPassword}>
                                        <Icon name={"copy"} size={20}></Icon>
                                    </Button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-6">

                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default PasswordGeneratorModal