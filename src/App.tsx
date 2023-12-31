import React from "react";
import {PrivateKeyProvider} from "./context/PrivateKeyContext.tsx";

function App({children}:{children: React.ReactNode}) {
    return (
        <>
            <PrivateKeyProvider>
                <div className="flex flex-col w-full justify-center align-center">
                    <header className="flex justify-center bg-white  w-full border-b border-gray-100 text-2xl tracking-wide font-light items-center">
                        {/*<Badge color="purple" className={"w-fit"} icon={() => (<>*/}
                        {/*    <Icon name={"shield"} size={19}></Icon>*/}
                        {/*</>)}>*/}

                        {/*</Badge>*/}
                        <img src={"logo.png"} className={"h-8"}/>
                        <div className={"ml-1.5"}>mini<span className={"font-bold"} style={{fontFamily:"Asap"}}>pm</span></div>
                    </header>
                    <main className={"flex w-3/4 mx-auto flex-col justify-center items-center"}>
                        {children}
                    </main>
                </div>
            </PrivateKeyProvider>
        </>
    )
}

export default App
