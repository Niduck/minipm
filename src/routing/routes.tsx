import IndexView from "../views/IndexView.tsx";
import PasswordFileView from "../views/PasswordFileView.tsx";

 const routes = [

    {
        path: "/",
        element: <IndexView/>
    },
     {
         path: "/file",
         element: <PasswordFileView/>
     },

]
export default routes;