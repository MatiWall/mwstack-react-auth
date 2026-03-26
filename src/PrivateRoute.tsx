import React, { useEffect } from "react";
import { useAuthContext } from "./provider"

type ProtectedRouteProps = {
    children: React.ReactNode
}

const PrivateRoute : React.FC<ProtectedRouteProps> = ({children}) => {

    const {isAuthenticated} = useAuthContext();

    if (!isAuthenticated){
        return <div>You are not authenticated</div>
    }

    return <>{children}</>;
}

export default PrivateRoute