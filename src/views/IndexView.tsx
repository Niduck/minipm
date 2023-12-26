import PasswordFileModal from "../views/components/PasswordFileModal.tsx";
import { useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import passwordsIDB from "../db/PasswordsIDB.ts";

function IndexView() {

    const navigate = useNavigate();
    const [passwordFileModalOpen, setPasswordFileModalOpen] = useState(false)

    useEffect(() => {
        const storage = localStorage.getItem('minipm_lock');
        if (storage) {
            const lock = localStorage.getItem('minipm_lock') ? JSON.parse(storage) : null;
            if (lock) {
                navigate(`/fichier/${lock.name}`)
            }
        }
    }, [navigate]);

    function passwordFileModalOnClose(data?:string) {
        setPasswordFileModalOpen(false)
        if (data) {
            navigate(`/fichier/${data}`)
        }
    }

    async function openPasswordFilePicker() {
        try {
            // Vérifier si l'API est disponible
            if ('showOpenFilePicker' in window) {
                // Demander à l'utilisateur de choisir un fichier
                // @ts-ignore
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Text Files',
                        accept: {'text/plain': ['.minipm']},
                    }],
                });

                // Obtenir un objet File
                const file = await fileHandle.getFile();

                const [name] = file.name.split(".");
                // Lire le contenu du fichier
                const text = await file.text();
                console.log(text); // Affiche le contenu du fichier

                const [salt, passwordsAdJSON] = text.split("__");
                console.log(salt, passwordsAdJSON)
                localStorage.setItem('minipm_lock', JSON.stringify({
                    name: name,
                    salt: salt
                }))
                const _passwordsIDB = await passwordsIDB
                const passwords = JSON.parse(passwordsAdJSON);
                for (const password of passwords) {
                    console.log(password)
                    _passwordsIDB.add(password.id, password)
                }

                navigate(`/fichier/${name}`)
            } else {
                console.log("L'API File System Access n'est pas disponible dans ce navigateur.");
            }
        } catch (err) {
            console.error(err);
        }

    }

    function passwordFileModalOnOpen() {
        setPasswordFileModalOpen(true)
    }

    return (
        <>
            <div className="flex flex-col w-2/4 bg-white text-gray-700 mx-auto border border-gray-200 px-1.5  py-1.5 rounded-md">
                <section onClick={passwordFileModalOnOpen}
                         className="flex flex-col bg-white border-b border-gray-200 py-6 px-6 cursor-pointer hover:bg-gray-100">
                    <h4>Create a passwords file</h4>
                </section>
                <section onClick={openPasswordFilePicker}
                         className="flex flex-col bg-white border-b border-gray-200 py-6 px-6 cursor-pointer hover:bg-gray-100">
                    <h4>Open a <i>.minipm</i> passwords file</h4>
                </section>
                {/*<section className="flex flex-col border-b border-gray-200 py-6 px-6 cursor-pointer hover:bg-gray-100">*/}
                {/*    <h4>Chiffrer un fichier</h4>*/}
                {/*</section>*/}
                {/*<section className="flex flex-col py-6 px-6 cursor-pointer hover:bg-gray-100">*/}
                {/*    <h4>Déchiffrer un fichier</h4>*/}
                {/*</section>*/}
            </div>
            <PasswordFileModal isOpen={passwordFileModalOpen} onClose={passwordFileModalOnClose}></PasswordFileModal>
        </>
    )
}

export default IndexView
